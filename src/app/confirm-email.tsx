import { useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AuthPageLayout } from "@/components/AuthPageLayout";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { TextField } from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { useAuthKeyboardFocus } from "@/hooks/useAuthKeyboardFocus";
import { isCloudConfigured, requireSupabase } from "@/lib/cloud/client";

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof params.email === "string" ? params.email : "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"verify" | "resend" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { scrollRef, onInputFocus } = useAuthKeyboardFocus();

  const normalizedEmail = email.trim().toLowerCase();
  const validEmail = /^\S+@\S+\.\S+$/.test(normalizedEmail);

  const verify = async () => {
    setError(null);
    setNotice(null);
    if (!validEmail) {
      setError("Enter the email address you used to register.");
      return;
    }
    if (!/^\d{6,8}$/.test(code.trim())) {
      setError("Enter the confirmation code from your email.");
      return;
    }

    setBusy("verify");
    try {
      const { data, error: authError } = await requireSupabase().auth.verifyOtp({
        email: normalizedEmail,
        token: code.trim(),
        type: "email",
      });
      if (authError) throw authError;
      if (!data.session) {
        setNotice("Email confirmed. Log in with your password to finish opening your account.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not confirm this email. Try the latest code.");
    } finally {
      setBusy(null);
    }
  };

  const resend = async () => {
    setError(null);
    setNotice(null);
    if (!validEmail) {
      setError("Enter the email address you used to register.");
      return;
    }

    setBusy("resend");
    try {
      const { error: authError } = await requireSupabase().auth.resend({
        type: "signup",
        email: normalizedEmail,
      });
      if (authError) throw authError;
      setCode("");
      setNotice("A new confirmation email was requested. Use its latest code when it arrives.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not resend the email. Try again later.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AuthPageLayout
      step="03 / Verify email"
      title="CHECK"
      highlight="INBOX."
      subtitle="Enter the code sent to your email to finish creating your account."
      scrollRef={scrollRef}
      topAction={<IconButton icon="back" label="Back to registration" onPress={() => router.replace("/register")} />}
      footer={
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Return to login"
          className="min-h-12 flex-row flex-wrap items-center justify-center gap-2"
          onPress={() => router.replace("/auth")}
        >
          <ThemedText variant="label">ALREADY CONFIRMED?</ThemedText>
          <View className="bg-brand px-1">
            <ThemedText variant="label">LOG IN</ThemedText>
          </View>
        </Pressable>
      }
    >
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
        autoComplete="one-time-code"
        keyboardType="number-pad"
        label="CONFIRMATION CODE"
        maxLength={8}
        onFocus={onInputFocus}
        onChangeText={setCode}
        placeholder="Code from your email"
        value={code}
      />
      <ThemedText variant="caption">
        Your records stay on this device until your email is confirmed and your account opens.
      </ThemedText>
      {error ? <ThemedText accessibilityRole="alert">{error}</ThemedText> : null}
      {notice ? <ThemedText accessibilityLiveRegion="polite">{notice}</ThemedText> : null}
      {!isCloudConfigured ? (
        <ThemedText accessibilityRole="alert">Account service is not configured yet.</ThemedText>
      ) : null}
      <Button
        disabled={!isCloudConfigured || busy !== null}
        loading={busy === "verify"}
        onPress={() => void verify()}
        size="lg"
        title="CONFIRM EMAIL"
      />
      <Button
        disabled={!isCloudConfigured || busy !== null}
        loading={busy === "resend"}
        onPress={() => void resend()}
        title="RESEND CODE"
        variant="secondary"
      />
    </AuthPageLayout>
  );
}
