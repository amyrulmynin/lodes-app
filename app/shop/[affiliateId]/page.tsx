import { PublicShop } from "@/components/public/shop";

export default function PublicShopPage({ params }: { params: { affiliateId: string } }) {
  return <PublicShop affiliateId={params.affiliateId} />;
}
