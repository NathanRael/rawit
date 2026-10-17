import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormActions } from "@/components/FormActions";
import { TextField } from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import {
  createSubscriber,
  getSubscriberById,
  updateSubscriber,
} from "@/lib/database/repositories";
import { subscriberDetailsHref, subscribersHref } from "@/lib/navigation";
import { subscriberSchema, type SubscriberFormValues } from "@/lib/validation/subscriber";

type SubscriberFormProps = {
  subscriberId?: string;
  embedded?: boolean;
  onCancel?: () => void;
  onSaved?: (subscriberId: string) => void;
};

export function SubscriberForm({
  subscriberId,
  embedded = false,
  onCancel,
  onSaved,
}: SubscriberFormProps) {
  const router = useRouter();
  const [isLoadingSubscriber, setIsLoadingSubscriber] = useState(subscriberId !== undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscriberFormValues>({
    resolver: zodResolver(subscriberSchema),
    defaultValues: { name: "", phone: "", email: "", notes: "" },
  });

  useEffect(() => {
    if (!subscriberId) return;
    let isCurrent = true;

    const load = async () => {
      try {
        const subscriber = await getSubscriberById(subscriberId);
        if (!isCurrent) return;
        if (!subscriber) {
          setLoadError("This subscriber could not be found. It may have been removed.");
          return;
        }
        reset({
          name: subscriber.name,
          phone: subscriber.phone ?? "",
          email: subscriber.email ?? "",
          notes: subscriber.notes ?? "",
        });
      } catch (error) {
        if (isCurrent) {
          setLoadError(error instanceof Error ? error.message : "Could not load this subscriber.");
        }
      } finally {
        if (isCurrent) setIsLoadingSubscriber(false);
      }
    };

    void load();
    return () => {
      isCurrent = false;
    };
  }, [loadAttempt, reset, subscriberId]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      if (subscriberId) {
        const updated = await updateSubscriber(subscriberId, values);
        if (!updated) {
          setLoadError("This subscriber no longer exists.");
          return;
        }
        if (onSaved) onSaved(updated.id);
        else router.replace(subscriberDetailsHref(updated.id));
        return;
      }

      const created = await createSubscriber(values);
      if (onSaved) onSaved(created.id);
      else router.replace(subscriberDetailsHref(created.id));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not save this subscriber.");
    }
  });

  if (isLoadingSubscriber) {
    return <ThemedText accessibilityLiveRegion="polite">Loading subscriber details…</ThemedText>;
  }

  if (loadError) {
    return (
      <Card className="gap-4">
        <ThemedText accessibilityRole="alert">{loadError}</ThemedText>
        {subscriberId ? (
          <Button
            onPress={() => {
              setIsLoadingSubscriber(true);
              setLoadError(null);
              setLoadAttempt((attempt) => attempt + 1);
            }}
            title="Try again"
            variant="secondary"
          />
        ) : null}
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
            error={errors.name?.message}
            label="Name *"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="e.g. Alex Morgan"
            returnKeyType="next"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <TextField
            autoComplete="tel"
            error={errors.phone?.message}
            keyboardType="phone-pad"
            label="Phone (optional)"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="Phone number"
            returnKeyType="next"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            error={errors.email?.message}
            keyboardType="email-address"
            label="Email (optional)"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="name@example.com"
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
            placeholder="Add a note about this subscriber"
            textAlignVertical="top"
            value={field.value}
          />
        )}
      />
      {submitError ? <ThemedText accessibilityRole="alert">{submitError}</ThemedText> : null}
      <FormActions
        isSubmitting={isSubmitting}
        onCancel={() => {
          if (onCancel) {
            onCancel();
            return;
          }
          if (router.canGoBack()) router.back();
          else router.replace(subscribersHref);
        }}
        onSave={() => void onSubmit()}
        saveTitle={subscriberId ? "Save changes" : "Create subscriber"}
      />
    </FormContainer>
  );
}
