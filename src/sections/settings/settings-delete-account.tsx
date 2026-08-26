"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { DeleteDialog } from "src/components/delete-dialog";
import { Button } from "src/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "src/components/ui/card";
import { useAuth } from "src/hooks/use-auth";
import { wrapAsync } from "src/utils/wrap-errors";

export function SettingsDeleteAccount() {
  const router = useRouter();
  const [deleteModal, setDeleteModal] = useState(false);
  const openModal = useCallback(() => setDeleteModal(true), []);
  const closeModal = useCallback(() => setDeleteModal(false), []);
  const { deleteAccount } = useAuth();

  const onDelete = async () => {
    await wrapAsync(async () => {
      await deleteAccount();
      toast.success("Successfully deleted your account.");
      router.replace("/login");
    });
  };

  return (
    <>
      <Card className="border-destructive/25 bg-destructive/[0.03]">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 py-4">
          <div className="space-y-1">
            <CardTitle className="text-base text-destructive">Delete account</CardTitle>
            <CardDescription>Permanently remove your account and all associated data</CardDescription>
          </div>
          <Button variant="destructive" size="sm" className="shrink-0" onClick={openModal}>
            Delete
          </Button>
        </CardHeader>
      </Card>
      <DeleteDialog
        open={deleteModal}
        title="Delete account?"
        desc="This will permanently delete your account and all data associated with you."
        onClose={closeModal}
        onDelete={onDelete}
      />
    </>
  );
}
