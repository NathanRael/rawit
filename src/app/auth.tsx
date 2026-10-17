import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { isAuthApiError } from "@supabase/supabase-js";

import { AuthPageLayout } from "@/components/AuthPageLayout";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { useAuthKeyboardFocus } from "@/hooks/useAuthKeyboardFocus";
import { isCloudConfigured, requireSupabase } from "@/lib/cloud/client";
import { useAuthStore } from "@/store/auth";

export default function LoginScreen() {
  const router = useRouter();
  const ready = useAuthStore((state) => state.ready);
  const startupError = useAuthStore((state) => state.error);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: authError } = await requireSupabase().auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (authError) {
        if (isAuthApiError(authError) && authError.code === "email_not_confirmed") {
          setPassword("");
          router.replace({ pathname: "/confirm-email", params: { email: normalizedEmail } });
          return;
        }
        throw authError;
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageLayout
      step="01 / Account access"
      title="WELCOME"
      highlight="BACK!"
      subtitle="Sign in to pick up where you left off."
      scrollRef={scrollRef}
      footer={
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Create an account"
          className="min-h-12 flex-row flex-wrap items-center justify-center gap-2"
          onPress={() => router.push("/register")}
        >
          <ThemedText variant="label">NEW HERE?</ThemedText>
          <View className="bg-brand px-1">
            <ThemedText variant="label">CREATE ACCOUNT</ThemedText>
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
            autoComplete="current-password"
            label="PASSWORD"
            onFocus={onInputFocus}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            value={password}
          />
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
            title="LOG IN"
          />
        </>
      )}
    </AuthPageLayout>
  );
}
