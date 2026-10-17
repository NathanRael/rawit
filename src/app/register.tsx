import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useRouter } from "expo-router";

import { AuthPageLayout } from "@/components/AuthPageLayout";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { TextField } from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { useAuthKeyboardFocus } from "@/hooks/useAuthKeyboardFocus";
import { isCloudConfigured, requireSupabase } from "@/lib/cloud/client";
import { useAuthStore } from "@/store/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const ready = useAuthStore((state) => state.ready);
  const startupError = useAuthStore((state) => state.error);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { scrollRef, onInputFocus } = useAuthKeyboardFocus();

  const submit = async () => {
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    let confirmationEmail: string | null = null;
    try {
      const { data, error: authError } = await requireSupabase().auth.signUp({
        email: normalizedEmail,
        password,
      });
      if (authError) throw authError;
      if (!data.session) {
        if (!data.user) throw new Error("Could not start account confirmation. Try again.");
        setPassword("");
        setConfirmPassword("");
        confirmationEmail = normalizedEmail;
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create this account.");
    } finally {
      setIsSubmitting(false);
    }
    if (confirmationEmail) {
      router.replace({ pathname: "/confirm-email", params: { email: confirmationEmail } });
    }
  };

  return (
    <AuthPageLayout
      step="02 / New account"
      title="START"
      highlight="FRESH."
      subtitle="Create an account for your networks, people, and payments."
      scrollRef={scrollRef}
      topAction={<IconButton icon="back" label="Back to login" onPress={() => router.replace("/auth")} />}
      footer={
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Log in to an existing account"
          className="min-h-12 flex-row flex-wrap items-center justify-center gap-2"
          onPress={() => router.replace("/auth")}
        >
          <ThemedText variant="label">ALREADY HAVE AN ACCOUNT?</ThemedText>
          <View className="bg-brand px-1">
            <ThemedText variant="label">LOG IN</ThemedText>
          </View>
        </Pressable>
      }
    >
      {!ready ? (
        <View className="items-center gap-3 py-8">
          <ActivityIndicator accessibilityLabel="Preparing account" />
          <ThemedText accessibilityLiveRegion="polite">Preparing your account…</ThemedText>
        </View>
      ) : (
        <>
          <TextField
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            label="EMAIL ADDRESS"
            onFocus={onInputFocus}
            onChangeText={setEmail}
            placeholder="you@example.com"
            value={email}
          />
          <TextField
            autoComplete="new-password"
            label="PASSWORD"
            onFocus={onInputFocus}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            value={password}
          />
          <TextField
            autoComplete="new-password"
            label="CONFIRM PASSWORD"
            onFocus={onInputFocus}
            onChangeText={setConfirmPassword}
            placeholder="Enter it again"
            secureTextEntry
            value={confirmPassword}
          />
          <ThemedText variant="caption">Existing records on this device will be added to your first account.</ThemedText>
          {error || startupError ? (
            <ThemedText accessibilityRole="alert">{error ?? startupError}</ThemedText>
          ) : null}
          {!isCloudConfigured ? (
            <ThemedText accessibilityRole="alert">
              Account service is not configured yet. Add the Supabase project URL and publishable key to the app environment.
            </ThemedText>
          ) : null}
          <Button
            disabled={!isCloudConfigured}
            loading={isSubmitting}
            onPress={() => void submit()}
            size="lg"
            title="CREATE ACCOUNT"
          />
        </>
      )}
    </AuthPageLayout>
  );
}
