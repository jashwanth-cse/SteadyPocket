import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { Modal, View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface FirebaseRecaptchaRef {
  verify: () => Promise<string>;
  reset: () => void;
  applicationVerifier?: any;
}

interface Props {
  baseUrl?: string;
}

const FirebaseRecaptcha = forwardRef<FirebaseRecaptchaRef, Props>(
  ({ baseUrl }, ref) => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const webViewRef = useRef<WebView>(null);

    // Promise resolvers stored to return the token to the caller (authService)
    const resolvePromise = useRef<((token: string) => void) | null>(null);
    const rejectPromise = useRef<((error: Error) => void) | null>(null);

    useImperativeHandle(ref, () => ({
      verify: () => {
        return new Promise<string>((resolve, reject) => {
          resolvePromise.current = resolve;
          rejectPromise.current = reject;
          setVisible(true);
          setLoading(true);
        });
      },
      reset: () => {
        setVisible(false);
        setLoading(true);
        resolvePromise.current = null;
        rejectPromise.current = null;
      },
    }));

    const onMessage = (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'token' && data.token) {
          setVisible(false);
          resolvePromise.current?.(data.token);
        } else if (data.type === 'error') {
          setVisible(false);
          rejectPromise.current?.(new Error(data.message || 'reCAPTCHA failed.'));
        }
      } catch (e) {
        // ignore malformed messages
      }
    };

    // The HTML content loads the actual reCAPTCHA widget via Google's JS library
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <script src="https://www.google.com/recaptcha/api.js" async defer></script>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background-color: rgba(0,0,0,0.5);
            }
            .container {
              background: white;
              padding: 20px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
          </style>
          <script>
            function onRecaptchaSuccess(token) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'token', token }));
            }
            function onRecaptchaError() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Verification expired or failed' }));
            }
          </script>
        </head>
        <body>
          <div class="container">
            <!-- Native reCAPTCHA implementation using Firebase /__/auth/handler is required. -->
            <p>Wait for Firebase validation...</p>
          </div>
        </body>
      </html>
    `;

    return (
      <Modal visible={visible} transparent={true} animationType="fade">
        <View style={styles.overlay}>
          <WebView
            ref={webViewRef}
            source={{
              html: htmlContent,
              baseUrl: baseUrl,
            }}
            style={styles.webview}
            onMessage={onMessage}
            onLoadEnd={() => setLoading(false)}
            bounces={false}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            originWhitelist={['*']}
            javaScriptEnabled={true}
          />
          {loading && (
            <View style={[StyleSheet.absoluteFill, styles.loaderContainer]}>
              <ActivityIndicator size="large" color="#1A56DB" />
            </View>
          )}
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FirebaseRecaptcha;
