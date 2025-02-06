import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();

  const handleRegister = async () => {
    try {
      await register(email, password, name, lastName);
      Alert.alert('Success', 'Registration successful!');
      router.replace('/(auth)/login'); // Navigate to login after successful registration
    } catch (error) {
      Alert.alert('Registration Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/LogoColored.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      
      <Text style={styles.title}>Register</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <Button title="Register" onPress={handleRegister} />
      
      <Link href="/(auth)/login" style={styles.link}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  link: {
    marginTop: 20,
  },
  linkText: {
    color: 'blue',
    textAlign: 'center',
  },
}); 