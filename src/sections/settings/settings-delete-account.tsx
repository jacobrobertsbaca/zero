import { enqueueSnackbar } from "notistack";
import { useCallback, useState } from "react";
import { DeleteDialog } from "src/components/delete-dialog";
import { useAuth } from "src/hooks/use-auth";
import { wrapAsync } from "src/utils/wrap-errors";
import { Button } from "src/components/ui/button";
import { Card, CardHeader, CardTitle } from "src/components/ui/card";

export const SettingsDeleteAccount = () => {
  const [deleteModal, setDeleteModal] = useState(false);
  const openModal = useCallback(() => setDeleteModal(true), []);
  const closeModal = useCallback(() => setDeleteModal(false), []);
  const { deleteAccount } = useAuth();
  const onDelete = async () => {
    await wrapAsync(async () => {
      await deleteAccount();
      enqueueSnackbar("Successfully deleted your account.", { variant: "success" });
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 py-4">
        <CardTitle className="text-base">Delete Account</CardTitle>
        <Button variant="destructive" onClick={openModal}>
          Delete
        </Button>
      </CardHeader>
      <DeleteDialog
        open={deleteModal}
        title={`Delete account?`}
        desc={"This will permanently delete your account and all data associated with you."}
        onClose={closeModal}
        onDelete={onDelete}
      />
    </Card>
  );
};
