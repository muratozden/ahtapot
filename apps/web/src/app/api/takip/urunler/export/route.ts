import { connection } from "next/server";
import { buildProductsExcelBuffer, productsExportFilename } from "@/lib/products-excel";
import { getCurrentUser } from "@/lib/session";
import { listTrackedProductsForSeller } from "@/lib/tracked-products";

export async function GET() {
  await connection();
  const user = await getCurrentUser();
  const rows = await listTrackedProductsForSeller(user.id);
  const buffer = buildProductsExcelBuffer(rows);
  const filename = productsExportFilename();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
