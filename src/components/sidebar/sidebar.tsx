import { FormikValues } from "formik";
import { X } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { Form, FormProps } from "../form/form";
import { Button } from "src/components/ui/button";
import { Separator } from "src/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "src/components/ui/sheet";
import { cn } from "src/lib/utils";

type SidebarFooterContextValue = {
  el: HTMLElement | null;
};

const SidebarFooterContext = createContext<SidebarFooterContextValue>({ el: null });

export const useSidebarFooter = () => useContext(SidebarFooterContext);

type SidebarHeaderProps = {
  onClose: () => void;
  children: React.ReactNode;
};

const SidebarHeader = ({ onClose, children }: SidebarHeaderProps) => (
  <div>
    <div className="flex items-center justify-between px-3 py-3">
      <SheetTitle className="ml-1 text-base font-medium">{children}</SheetTitle>
      <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onClose}>
        <X className="size-4" />
        <span className="sr-only">Close</span>
      </Button>
    </div>
    <Separator />
  </div>
);

type SidebarProps<T extends FormikValues> = {
  open: boolean;
  onClose: () => void;
  children?: FormProps<T>["children"];
  FormProps?: Omit<FormProps<T>, "children">;
  title?: FormProps<T>["children"];
};

export const Sidebar = <T extends FormikValues>({ open, onClose, children, FormProps, title }: SidebarProps<T>) => {
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);
  const formProps = FormProps
    ? { className: cn("flex h-full flex-col overflow-hidden", FormProps.className), ...FormProps }
    : {
        initialValues: {} as T,
        onSubmit(_values: T) {},
        className: "flex h-full flex-col overflow-hidden",
      };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[500px] [&>button]:hidden">
        <Form {...formProps}>
          {(formik) => (
            <SidebarFooterContext.Provider value={{ el: footerEl }}>
              <div className="flex h-full flex-col overflow-hidden">
                <SidebarHeader onClose={onClose}>{typeof title === "function" ? title(formik) : title}</SidebarHeader>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  <div className="flex flex-col gap-4 p-5">
                    {typeof children === "function" ? children(formik) : children}
                  </div>
                </div>
                <div ref={setFooterEl} className="empty:hidden" />
              </div>
            </SidebarFooterContext.Provider>
          )}
        </Form>
      </SheetContent>
    </Sheet>
  );
};
