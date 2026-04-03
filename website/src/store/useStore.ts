import { create } from 'zustand';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface User {
  id: string;
  emp_name: string;
  phone: string;
  platform: string;
  status: 'active' | 'under_review' | 'suspended' | 'banned';
  work_location: string;
  partner_id: string;
  risk_score: number;
}

export interface Policy {
  id: string;
  user_id: string;
  premium: number;
  coverage_limit: number;
  coverage_start: string;
  coverage_end: string;
  status: 'active' | 'expired' | 'cancelled';
  risk_score: number;
  rider_name?: string;
  city?: string;
}

interface Payout {
  id: string;
  userId: string;
  user_id?: string;
  amount: number;
  total_payout?: number;
  event_type?: string;
  location?: string;
  timestamp: any;
  status: string;
}

interface Alert {
  id: string;
  alert_type: string;
  rider_name?: string;
  userId?: string;
  user_id?: string;
  risk_score: number;
  timestamp: any;
  status: string;
}

interface AdminStore {
  riders: User[];
  payouts: Payout[];
  policies: Policy[];
  alerts: Alert[];
  systemEvents: any[];
  isLoading: boolean;
  timeRange: '24h' | '7d' | '30d' | 'custom' | 'today' | 'yesterday';
  customDateRange: { start: string | null; end: string | null };
  
  // Real-time synchronization
  initListeners: () => void;
  fetchData: () => Promise<void>;
  setTimeRange: (range: '24h' | '7d' | '30d' | 'custom' | 'today' | 'yesterday', custom?: { start: string | null; end: string | null }) => void;
  
  // API Actions
  performAction: (endpoint: string, method: string, body?: any) => Promise<any>;
  getUserName: (userId: string) => string;

  // Derived Stats
  getStats: () => {
    totalUsers: number;
    activeUsers: number;
    totalPayoutAmount: number;
    fraudAlerts: number;
    affectedRiders: number;
  };
}

export const useStore = create<AdminStore>((set, get) => ({
  riders: [],
  payouts: [],
  policies: [],
  alerts: [],
  systemEvents: [],
  isLoading: true,
  timeRange: '24h',
  customDateRange: { start: null, end: null },

  setTimeRange: (range, custom) => {
    set({ timeRange: range, customDateRange: custom || { start: null, end: null } });
  },

  performAction: async (endpoint, method, body) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized: No user logged in');
    const token = await user.getIdToken();

    const envApiUrl = (import.meta as any).env?.VITE_API_URL;
    // Prefer absolute URL if provided, otherwise trust the proxy
    const apiUrl = envApiUrl && envApiUrl.startsWith('http') ? envApiUrl : (envApiUrl || '');
    
    // Removed console.log for production


    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : undefined
      });
      
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!response.ok) {
        const errorData = isJson ? await response.json().catch(() => ({ message: response.statusText })) : { message: response.statusText };
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      if (isJson) {
        return await response.json();
      } else {
        const text = await response.text();
        console.warn('Expected JSON response but got:', text.substring(0, 100));
        return { message: 'Success (Non-JSON)', text: text.substring(0, 100) };
      }
    } catch (error: any) {
      // Error handled by UI via throw err

      throw error;
    }
  },

  getUserName: (userId) => {
    if (!userId) return 'Anonymous';
    const user = get().riders.find(r => 
      r.id === userId || 
      (r as any).user_id === userId || 
      String(r.id).toLowerCase() === String(userId).toLowerCase()
    );
    return user ? user.emp_name : userId;
  },

  fetchData: async () => {
    set({ isLoading: true });
    try {
      const data = await get().performAction('/api/dashboard/stats', 'GET');
      set({ 
        riders: data.riders || [],
        payouts: data.payouts || [],
        policies: data.policies || [],
        alerts: data.alerts || [],
        systemEvents: data.systemEvents || [],
        isLoading: false 
      });
    } catch (error) {
      // Silent fallback

      set({ isLoading: false });
    }
  },

  initListeners: () => {
    const handleError = (error: any) => {
      // Fallback if not already loaded or if permission denied
      if (error.code === 'permission-denied') {
        get().fetchData();
      }
      set({ isLoading: false });
    };

    // Fail-safe: ensure loading resolves within 5 seconds even on slow networks
    setTimeout(() => {
      if (get().isLoading) {
        set({ isLoading: false });
      }
    }, 5000);

    // 1. Users Listener
    onSnapshot(collection(db, 'users'), (snapshot) => {
      const riders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      set({ riders, isLoading: false });
    }, handleError);

    // 2. Payouts Listener
    const payoutsQuery = query(collection(db, 'payouts'), orderBy('timestamp', 'desc'), limit(200));
    onSnapshot(payoutsQuery, (snapshot) => {
      const payouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payout));
      set({ payouts });
    }, handleError);

    // 3. Fraud Alerts Listener
    const alertsQuery = query(collection(db, 'fraud_alerts'), orderBy('timestamp', 'desc'), limit(200));
    onSnapshot(alertsQuery, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
      set({ alerts });
    }, handleError);

    // 4. System Events (Audit Logs) Listener
    const eventsQuery = query(collection(db, 'system_events'), orderBy('timestamp', 'desc'), limit(200));
    onSnapshot(eventsQuery, (snapshot) => {
      const systemEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ systemEvents });
    }, handleError);

    // 5. Policies Listener
    onSnapshot(collection(db, 'policies'), (snapshot) => {
      const policies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Policy));
      set({ policies });
    }, handleError);
  },

  getStats: () => {
    const { riders, payouts, alerts, timeRange, customDateRange } = get();
    
    const filterByDate = (item: any) => {
      if (!item.timestamp && !item.created_at) return true;
      const itemDate = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp || item.created_at);
      const now = new Date();

      if (timeRange === '24h') return (now.getTime() - itemDate.getTime()) <= 24 * 60 * 60 * 1000;
      if (timeRange === '7d') return (now.getTime() - itemDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      if (timeRange === '30d') return (now.getTime() - itemDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
      if (timeRange === 'custom') {
        const start = customDateRange.start ? new Date(customDateRange.start) : null;
        let end = customDateRange.end ? new Date(customDateRange.end) : null;
        
        if (start && end) {
          end.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= end;
        } else if (start && !end) {
          end = new Date(start);
          end.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= end;
        }
      }
      if (timeRange === 'today') {
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setHours(23,59,59,999);
        return itemDate >= start && itemDate <= end;
      }
      if (timeRange === 'yesterday') {
        const start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setHours(23,59,59,999);
        return itemDate >= start && itemDate <= end;
      }
      return true;
    };
    
    const totalUsers = riders.length;
    const activeUsers = riders.filter(r => String(r.status).toLowerCase() === 'active').length;

    const filteredPayouts = payouts.filter(filterByDate);
    const filteredAlerts = alerts.filter(filterByDate);
    
    let totalPayoutAmount = 0;
    const affectedUsers = new Set<string>();
    
    filteredPayouts.forEach(p => {
      const s = String(p.status).toLowerCase();
      if (s === 'approved' || s === 'completed' || s === 'processing') {
        totalPayoutAmount += (p.amount || (p as any).total_payout || 0);
      }
      affectedUsers.add(p.userId || (p as any).user_id || '');
    });
    
    const pendingAlerts = filteredAlerts.filter(a => {
      const s = String(a.status).toLowerCase();
      const st = s.toLowerCase();
      return st === 'pending' || st === 'flagged' || st === 'under_review' || st === 'action_required';
    }).length;

    return {
      totalUsers,
      activeUsers,
      totalPayoutAmount,
      fraudAlerts: pendingAlerts,
      affectedRiders: affectedUsers.size
    };
  }
}));
