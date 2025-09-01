import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { colors } from "../styles/colors";
import { typography } from "../styles/typography";
import { globalStyles } from "../styles/globalStyles";
import bookingAPI from "../services/bookingApi";

const AdminLoginScreen = ({ navigation }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!credentials.email.trim() || !credentials.password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login with:', credentials.email);
      console.log('Backend should be running on:', 'http://127.0.0.1:5000');
      
      const response = await bookingAPI.adminLogin(credentials.email, credentials.password);
      console.log('Login response received:', response);
      
      if (response.success) {
        // Store admin session data (in production, use secure storage like AsyncStorage)
        const adminData = response.data;
        console.log('Login successful:', adminData);
        
        // Navigate immediately to Admin dashboard
        console.log('Navigating to Admin screen with data:', adminData);
        navigation.navigate('Admin', { adminData });
        console.log('Navigation call completed');
        
        // Optional: Show a brief success message without blocking navigation
        // Alert.alert('Success', response.message || `Welcome, ${adminData.name}!`);
      } else {
        Alert.alert(
          'Login Failed', 
          response.error || 'Invalid email or password. Please try again.\n\nAvailable Credentials:\n• admin@booking.com / admin123\n• placement@college.edu / place123\n• headoffice@org.com / head123\n• manager@booking.com / manager123'
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Admin Login</Text>
          <Text style={styles.headerSubtitle}>Secure access to admin dashboard</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.flex} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Content */}
          <View style={styles.content}>
          <View style={styles.loginCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🔐</Text>
              <Text style={styles.cardTitle}>Administrator Access</Text>
              <Text style={styles.cardSubtitle}>
                Enter your admin credentials to access the booking management system
              </Text>
            </View>

            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>📧</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter admin email"
                    value={credentials.email}
                    onChangeText={(text) => setCredentials({...credentials, email: text})}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={colors.lightGray}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Enter password"
                    value={credentials.password}
                    onChangeText={(text) => setCredentials({...credentials, password: text})}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={colors.lightGray}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.loginButtonText}>Authenticating...</Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>🚀 Login to Dashboard</Text>
                )}
              </TouchableOpacity>


            </View>
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Text style={styles.securityIcon}>🛡️</Text>
            <Text style={styles.securityText}>
              Your login credentials are encrypted and secure. Only authorized personnel can access the admin dashboard.
            </Text>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  
  // Header
  header: {
    backgroundColor: colors.primary,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backIcon: {
    fontSize: 20,
    color: colors.white,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
  },

  // Main Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },

  // Login Card
  loginCard: {
    ...globalStyles.card,
    padding: 0,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardHeader: {
    backgroundColor: colors.light,
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  cardTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Form
  formContainer: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 12,
    color: colors.textLight,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 16,
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 16,
  },

  // Login Button
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },

  // Demo Info
  demoInfo: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  demoTitle: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  demoCredentials: {
    marginBottom: 8,
  },
  demoText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  demoEmail: {
    ...typography.small,
    color: colors.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  // Security Notice
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  securityIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  securityText: {
    ...typography.small,
    color: colors.textLight,
    lineHeight: 20,
    flex: 1,
  },
});

export default AdminLoginScreen;