"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Task, TaskStatus, TaskPriority } from "@/lib/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DatePicker } from "@/components/tasks/DatePicker";
import { Trash2 } from "lucide-react";

const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .refine((v) => v.trim().length > 0, "Title cannot be only whitespace"),
  description: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "in_progress", "done"]),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  mode: "create" | "edit";
  initialData?: Task;
  onSubmit: (data: {
    title: string;
    description: string;
    due_date: string | null;
    priority: TaskPriority;
    status: TaskStatus;
  }) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}

export function TaskForm({ mode, initialData, onSubmit, onDelete }: TaskFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      priority: initialData?.priority ?? "medium",
      status: initialData?.status ?? "todo",
    },
  });

  const dueDate = initialData?.due_date ? new Date(initialData.due_date) : undefined;
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(dueDate);

  const priority = watch("priority");
  const status = watch("status");
  const description = watch("description");

  const handleFormSubmit = async (data: TaskFormValues) => {
    try {
      await onSubmit({
        title: data.title,
        description: data.description ?? "",
        due_date: selectedDate ? selectedDate.toISOString().split("T")[0] : null,
        priority: data.priority,
        status: data.status,
      });
      toast.success(mode === "create" ? "Task created" : "Task updated");
      router.push("/tasks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <Card className="border-[#DAC0FF]/30 shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-lg font-semibold text-[#222222]">
          {mode === "create" ? "Create New Task" : "Edit Task"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="font-body text-sm font-medium text-[#222222]">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter task title"
              {...register("title")}
              className="font-body"
              aria-describedby={errors.title ? "title-error" : undefined}
              aria-invalid={!!errors.title}
              maxLength={200}
            />
            {errors.title && (
              <p id="title-error" className="font-body text-xs text-red-500">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-body text-sm font-medium text-[#222222]">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Add a description (optional)"
              {...register("description")}
              className="min-h-[100px] font-body"
              rows={4}
              maxLength={5000}
            />
            <p className={`font-body text-xs text-right ${(description?.length ?? 0) >= 4800 ? "text-red-500" : "text-muted-foreground"}`}>
              {description?.length ?? 0} / 5000
            </p>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="font-body text-sm font-medium text-[#222222]">
              Due Date
            </Label>
            <DatePicker value={selectedDate} onChange={setSelectedDate} />
          </div>

          {/* Priority + Status row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-body text-sm font-medium text-[#222222]">
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(v) => setValue("priority", v as TaskPriority)}
              >
                <SelectTrigger className="font-body" aria-label="Select priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-body text-sm font-medium text-[#222222]">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(v) => setValue("status", v as TaskStatus)}
              >
                <SelectTrigger className="font-body" aria-label="Select status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-3 border-t border-[#DAC0FF]/20 pt-4">
          <div>
            {mode === "edit" && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="font-body text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-heading">
                      Delete this task?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-body">
                      This action cannot be undone. The task will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 font-body hover:bg-red-700"
                      onClick={async () => {
                        try {
                          await onDelete();
                          toast.success("Task deleted");
                          router.push("/tasks");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Failed to delete task.");
                        }
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="font-body"
              onClick={() => router.push("/tasks")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#B580FF] font-body font-semibold text-white hover:bg-[#5b57a2]"
            >
              {mode === "create" ? "Create Task" : "Save Changes"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

