import { NextResponse } from "next/server";
import { z } from "zod";
import { connectMongoose } from "@/lib/mongodb";
import { slugFromName } from "@/lib/slug";
import { getSiteModel } from "@/models/site";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  databaseName: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid site data" }, { status: 400 });
  }

  if (body.name === undefined && body.databaseName === undefined && body.isActive === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await connectMongoose();
  const site = await getSiteModel().findById(id);
  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  if (body.name) {
    site.name = body.name;
    const slug = slugFromName(body.name);
    if (slug) site.slug = slug;
  }
  if (body.databaseName) {
    site.databaseName = body.databaseName.trim();
  }
  if (body.isActive !== undefined) {
    site.isActive = body.isActive;
  }

  await site.save();
  return NextResponse.json({ site });
}
