import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ReviewsPage } from "@/components/reviews/reviews-page";

export default function AdminReviewsPage() {
  return (
    <AdminPageShell
      title="Customer Reviews"
      description="Semua maklum balas pelanggan - paparkan yang terbaik di shop"
    >
      <ReviewsPage />
    </AdminPageShell>
  );
}
