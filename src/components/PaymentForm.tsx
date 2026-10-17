import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View } from "react-native";

import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { createPayment, updatePayment } from "@/lib/database/repositories";
import { getLocalDate } from "@/lib/dates";
import { paymentSchema, type PaymentFormValues } from "@/lib/validation/payment";
import type { Payment } from "@/types";

type PaymentFormProps = {
  subscriptionId: string;
  payment?: Payment;
  onSaved: () => void | Promise<void>;
  onCancel: () => void;
};

export function PaymentForm({ subscriptionId, payment, onSaved, onCancel }: PaymentFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: payment ? String(payment.amount) : "",
      paidAt: payment?.paidAt ?? getLocalDate(),
      notes: payment?.notes ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      if (payment) {
        const updated = await updatePayment(payment.id, {
          amount: Number(values.amount),
          paidAt: values.paidAt,
          notes: values.notes,
        });
        if (!updated) {
          setSubmitError("This payment no longer exists.");
          return;
        }
      } else {
        await createPayment({
          subscriptionId,
          amount: Number(values.amount),
          paidAt: values.paidAt,
          notes: values.notes,
        });
      }
      await onSaved();
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : "Could not save this payment.");
    }
  });

  return (
    <View className="gap-4">
      <ThemedText variant="label">{payment ? "Edit payment" : "Record a payment"}</ThemedText>
      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <TextField
            error={errors.amount?.message}
            keyboardType="decimal-pad"
            label="Amount *"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="0.00"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="paidAt"
        render={({ field }) => (
          <TextField
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.paidAt?.message}
            keyboardType="numbers-and-punctuation"
            label="Payment date *"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="YYYY-MM-DD"
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
            numberOfLines={3}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="Add a note about this payment"
            textAlignVertical="top"
            value={field.value}
          />
        )}
      />
      {submitError ? <ThemedText accessibilityRole="alert">{submitError}</ThemedText> : null}
      <View className="gap-3">
        <Button
          loading={isSubmitting}
          onPress={() => void onSubmit()}
          title={payment ? "Save payment" : "Record payment"}
        />
        <Button
          disabled={isSubmitting}
          onPress={onCancel}
          title="Cancel"
          variant="secondary"
        />
      </View>
    </View>
  );
}
