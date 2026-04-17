import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { AppScreen } from '../../src/templates/AppScreen';
import { COLORS, TYPOGRAPHY } from '../../app/theme';

export default function TermsScreen() {
  return (
    <AppScreen title="Terms & Conditions" showBack>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[TYPOGRAPHY.titleLarge, { color: COLORS.primaryText, marginBottom: 8 }]}>
          SteadyPocket – Terms & Conditions
        </Text>
        <Text style={[TYPOGRAPHY.label, { color: COLORS.textSubtle, marginBottom: 24 }]}>
          Last updated: April 2026
        </Text>

        <Text style={styles.paragraph}>
          Welcome to SteadyPocket. By using this application, you agree to the following terms and conditions. Please read them carefully before proceeding.
        </Text>

        <Text style={styles.heading}>1. Overview</Text>
        <Text style={styles.paragraph}>
          SteadyPocket provides earnings protection for gig workers by offering automated payouts during verified disruptions such as heavy rainfall or external events. The platform uses real-time data, including location and platform activity, to determine eligibility.
        </Text>

        <Text style={styles.heading}>2. Eligibility</Text>
        <Text style={styles.paragraph}>To use SteadyPocket services, you must:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Be a registered delivery partner on supported platforms (e.g., Swiggy, Zomato)</Text>
          <Text style={styles.listItem}>• Complete identity verification (government ID, platform ID, and face verification)</Text>
          <Text style={styles.listItem}>• Maintain an active policy subscription</Text>
        </View>
        <Text style={styles.paragraph}>
          SteadyPocket reserves the right to verify and validate user eligibility at any time.
        </Text>

        <Text style={styles.heading}>3. Data Usage & Consent</Text>
        <Text style={styles.paragraph}>
          By accepting these terms, you consent to SteadyPocket collecting and using the following data:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Location Data: To verify your presence in eligible zones during disruption events</Text>
          <Text style={styles.listItem}>• Platform Activity Data: To confirm active working days and delivery activity</Text>
          <Text style={styles.listItem}>• Account Information: Including your registered details and policy status</Text>
        </View>
        <Text style={styles.paragraph}>Your data is used strictly for:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Determining payout eligibility</Text>
          <Text style={styles.listItem}>• Fraud detection and prevention</Text>
          <Text style={styles.listItem}>• Improving service reliability</Text>
        </View>
        <Text style={styles.paragraph}>
          We do not share your data with third parties without your consent.
        </Text>

        <Text style={styles.heading}>4. Location Verification</Text>
        <Text style={styles.paragraph}>
          SteadyPocket verifies your real-time location to ensure you are operating within your registered work zone.
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• If your current location does not match your registered work location, your account may be marked as "Under Review"</Text>
          <Text style={styles.listItem}>• During this period, payouts may be temporarily restricted</Text>
        </View>

        <Text style={styles.heading}>5. Automated Payout System</Text>
        <Text style={styles.paragraph}>
          SteadyPocket uses an automated system to trigger payouts based on verified disruption events.
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Payouts are credited when conditions such as heavy rainfall are detected in your working area</Text>
          <Text style={styles.listItem}>• The system validates eligibility using location, activity data, and fraud checks</Text>
        </View>
        <Text style={styles.paragraph}>
          SteadyPocket reserves the right to approve, reject, or review payouts based on system evaluation.
        </Text>

        <Text style={styles.heading}>6. Fraud Prevention</Text>
        <Text style={styles.paragraph}>
          To ensure fairness, SteadyPocket implements fraud detection mechanisms, including:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Detection of mock or manipulated location data</Text>
          <Text style={styles.listItem}>• Monitoring abnormal activity patterns</Text>
          <Text style={styles.listItem}>• Verification against historical and real-time data</Text>
        </View>
        <Text style={styles.paragraph}>If fraudulent activity is detected:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Your account may be restricted or suspended</Text>
          <Text style={styles.listItem}>• Payouts may be withheld or reversed</Text>
        </View>

        <Text style={styles.heading}>7. Complaints & Resolution</Text>
        <Text style={styles.paragraph}>
          Users can raise complaints through the app.
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Complaints are analyzed using automated systems and supporting data</Text>
          <Text style={styles.listItem}>• Some cases may be escalated for manual review</Text>
          <Text style={styles.listItem}>• Decisions made based on system analysis are final, subject to review policies</Text>
        </View>

        <Text style={styles.heading}>8. Policy Status & Access</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Only users with Active status are eligible for payouts</Text>
          <Text style={styles.listItem}>• Accounts marked as Under Review may have limited access to features</Text>
          <Text style={styles.listItem}>• Users must comply with all verification and validation processes</Text>
        </View>

        <Text style={styles.heading}>9. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          SteadyPocket is not liable for:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Delays or failures caused by inaccurate data from external sources</Text>
          <Text style={styles.listItem}>• Technical disruptions beyond our control</Text>
          <Text style={styles.listItem}>• Incorrect user-provided information</Text>
        </View>

        <Text style={styles.heading}>10. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          SteadyPocket reserves the right to update these Terms & Conditions at any time. Continued use of the app implies acceptance of the updated terms.
        </Text>

        <Text style={styles.heading}>11. Contact</Text>
        <Text style={styles.paragraph}>
          For support or queries, please use the in-app Support & Complaints section.
        </Text>

        <View style={styles.divider} />
        
        <Text style={[styles.paragraph, { fontStyle: 'italic', marginBottom: 40 }]}>
          By continuing to use SteadyPocket, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.
        </Text>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: COLORS.surface,
  },
  heading: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.primaryText,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSubtle,
    lineHeight: 24,
    marginBottom: 8,
  },
  list: {
    paddingLeft: 8,
    marginBottom: 16,
  },
  listItem: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSubtle,
    lineHeight: 24,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 24,
  }
});
