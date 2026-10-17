import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { wifiNetworkDetailsHref, wifiNetworksHref } from "@/lib/navigation";
import {
  createWifiNetwork,
  getWifiNetworkById,
  updateWifiNetwork,
} from "@/lib/database/repositories";
import { wifiNetworkSchema, type WifiNetworkFormValues } from "@/lib/validation/wifiNetwork";

type WifiNetworkFormProps = {
  networkId?: string;
  embedded?: boolean;
  onCancel?: () => void;
  onCreated?: () => void;
};

export function WifiNetworkForm({
  networkId,
  embedded = false,
  onCancel,
  onCreated,
}: WifiNetworkFormProps) {
  const router = useRouter();
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(networkId !== undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WifiNetworkFormValues>({
    resolver: zodResolver(wifiNetworkSchema),
    defaultValues: { name: "", ssid: "", notes: "" },
  });

  useEffect(() => {
    if (!networkId) return;
    let isCurrent = true;

    const load = async () => {
      try {
        const network = await getWifiNetworkById(networkId);
        if (!isCurrent) return;
        if (!network) {
          setLoadError("This WiFi network could not be found. It may have been removed.");
          return;
        }
        setLoadError(null);
        reset({ name: network.name, ssid: network.ssid ?? "", notes: network.notes ?? "" });
      } catch (error) {
        if (isCurrent) {
          setLoadError(error instanceof Error ? error.message : "Could not load this WiFi network.");
        }
      } finally {
        if (isCurrent) setIsLoadingNetwork(false);
      }
    };

    void load();
    return () => {
      isCurrent = false;
    };
  }, [loadAttempt, networkId, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      if (networkId) {
        const updated = await updateWifiNetwork(networkId, values);
        if (!updated) {
          setLoadError("This WiFi network no longer exists.");
          return;
        }
        router.replace(wifiNetworkDetailsHref(updated.id));
        return;
      }

      const created = await createWifiNetwork(values);
      if (onCreated) {
        onCreated();
        return;
      }
      router.replace(wifiNetworkDetailsHref(created.id));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not save this WiFi network.");
    }
  });

  if (isLoadingNetwork) {
    return <ThemedText accessibilityLiveRegion="polite">Loading network details…</ThemedText>;
  }

  if (loadError) {
    return (
      <Card className="gap-4">
        <ThemedText accessibilityRole="alert">{loadError}</ThemedText>
        <Button
          onPress={() => {
            setIsLoadingNetwork(true);
            setLoadError(null);
            setLoadAttempt((attempt) => attempt + 1);
          }}
          title="Try again"
          variant="secondary"
        />
      </Card>
    );
  }

  const FormContainer = embedded ? View : Card;

  return (
    <FormContainer className="gap-5">
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            autoCapitalize="words"
            autoComplete="off"
            error={errors.name?.message}
            label="Network name *"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="e.g. Home WiFi"
            returnKeyType="next"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="ssid"
        render={({ field }) => (
          <TextField
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.ssid?.message}
            label="SSID (optional)"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="Network identifier"
            returnKeyType="next"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <TextField
            error={errors.notes?.message}
            label="Notes (optional)"
            multiline
            numberOfLines={4}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="Add a note about this network"
            textAlignVertical="top"
            value={field.value}
          />
        )}
      />
      {submitError ? (
        <ThemedText accessibilityRole="alert" className="text-ink">
          {submitError}
        </ThemedText>
      ) : null}
      <ViewActions
        isSubmitting={isSubmitting}
        onCancel={() => {
          if (onCancel) {
            onCancel();
            return;
          }
          if (router.canGoBack()) router.back();
          else router.replace(wifiNetworksHref);
        }}
        onSave={() => void onSubmit()}
        saveTitle={networkId ? "Save changes" : "Create network"}
      />
    </FormContainer>
  );
}

function ViewActions({
  isSubmitting,
  onCancel,
  onSave,
  saveTitle,
}: {
  isSubmitting: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveTitle: string;
}) {
  return (
    <>
      <Button loading={isSubmitting} onPress={onSave} title={saveTitle} />
      <Button disabled={isSubmitting} onPress={onCancel} title="Cancel" variant="secondary" />
    </>
  );
}
