import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from "expo-router";
import {
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { Text } from "../components/Text";

const { width, height } = Dimensions.get('window');

export default function AuthLanding() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={{ uri: 'https://images.pexels.com/photos/7163379/pexels-photo-7163379.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', '#000']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* Logo and Welcome Text */}
            <View style={styles.header}>
              <Image
                source={require("../../assets/images/full.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.welcomeText}>
                Welcome to DuoTasks
              </Text>
              <Text style={styles.subtitleText}>
                Find help or earn money by helping others
              </Text>
            </View>

            <View style={styles.bottomSection}>
              {/* Auth Buttons */}
              <View style={styles.authButtons}>
                {/* Sign up button */}
                <Link href="/(auth)/signup" asChild>
                  <TouchableOpacity style={styles.signUpButton}>
                    <Text style={styles.signUpText}>
                      Get Started Free
                    </Text>
                  </TouchableOpacity>
                </Link>

                {/* Login button */}
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity style={styles.loginButton}>
                    <Text style={styles.loginText}>
                      I already have an account
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>

              {/* Social Login Section */}
              <View style={styles.socialSection}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialButtons}>
                  <TouchableOpacity 
                    style={styles.socialButton}
                    onPress={async () => {
                      console.log('=== Google button pressed ===');
                      console.log('Attempting navigation to google-auth...');
                      try {
                        // Try using replace to avoid stack issues
                        await router.push('/(auth)/google-auth' as any);
                        console.log('Navigation command executed');
                      } catch (err) {
                        console.error('Navigation failed:', err);
                        // Try alternative path
                        try {
                          await router.push('/google-auth' as any);
                        } catch (err2) {
                          console.error('Alternative navigation also failed:', err2);
                        }
                      }
                    }}
                  >
                    <FontAwesome name="google" size={20} color="#EA4335" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton}>
                    <FontAwesome name="facebook" size={20} color="#1877F2" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton}>
                    <FontAwesome name="envelope" size={20} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Terms and Privacy */}
              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundImage: {
    width: width,
    height: height,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    justifyContent: "space-between",
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  header: {
    alignItems: "center",
    marginTop: height * 0.1,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: -40,
    tintColor: '#fff',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 40,
  },
  bottomSection: {
    width: '100%',
  },
  authButtons: {
    gap: 12,
    marginBottom: 32,
  },
  signUpButton: {
    backgroundColor: "#2eac5f",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#2eac5f",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  signUpText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  socialSection: {
    marginBottom: 32,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  dividerText: {
    paddingHorizontal: 16,
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  termsText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 18,
  },
  linkText: {
    color: "#2eac5f",
    textDecorationLine: "underline",
  },
});
