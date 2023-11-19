import { Button, Card, CardHeader } from "@mui/material";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { DeleteDialog } from "src/components/delete-dialog";
import { useApi } from "src/hooks/use-api";
import { wrapAsync } from "src/utils/wrap-errors";

export const SettingsDeleteAccount = () => {
  const [deleteModal, setDeleteModal] = useState(false);
  const openModal = useCallback(() => setDeleteModal(true), []);
  const closeModal = useCallback(() => setDeleteModal(false), []);
  const { deleteAccount } = useApi();
  const router = useRouter();

  const onDelete = useCallback(async () => {
    await wrapAsync(async () => {
      await deleteAccount();
      router.push("/");
    });
  }, [router]);

  return (
    <Card sx={{ pb: 2 }}>
      <CardHeader
        title="Delete Account"
        action={
          <Button variant="contained" color="error" onClick={openModal}>
            Delete
          </Button>
        }
      />
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
