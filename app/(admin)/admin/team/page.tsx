import type { Metadata } from "next";
import { configured, writable } from "../../../../lib/env";
import { listTeam } from "../../../../lib/db";
import {
  AdminHeader, NotConfigured, NotWritable, Empty, Card, Pill, Button, Field,
  SaveBanner, fieldCls,
} from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Team" };

/**
 * The people shown on the site.
 *
 * This is content, not permissions — Team Access is next door for who can sign
 * in. Naming them separately is worth the two menu items: they are edited by
 * different people for different reasons, and merging them is how someone
 * removes a face from the about page and revokes an account by accident.
 *
 * Nobody is published until the toggle is ticked, so a half-written bio never
 * appears while it is being written.
 */
export default async function TeamPage({
  searchParams,
}: { searchParams: Promise<{ s?: string; m?: string }> }) {
  const { s, m } = await searchParams;
  if (!configured()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Configure" title="Team" /><NotConfigured /></div>;
  }

  const members = await listTeam();

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Configure"
        title="Team"
        intro="The people the site introduces. Permissions live in Team Access."
      />
      <SaveBanner state={s} message={m} />
      {!writable() && <NotWritable />}

      <Card title="Add someone">
        <form action="/api/admin/team" method="post" className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" htmlFor="t-name">
            <input id="t-name" name="name" required className={fieldCls} />
          </Field>
          <Field label="Role" htmlFor="t-role">
            <input id="t-role" name="role_title" placeholder="Owner" className={fieldCls} />
          </Field>
          <Field label="Photo URL" htmlFor="t-photo" className="sm:col-span-2"
            hint="Leave empty until there is a real photograph. An initial is honest; a stock face is not.">
            <input id="t-photo" name="photo_url" type="url" className={fieldCls} />
          </Field>
          <Field label="Bio" htmlFor="t-bio" className="sm:col-span-2">
            <textarea id="t-bio" name="bio" rows={3} className={fieldCls} />
          </Field>
          <div className="sm:col-span-2"><Button weight="loud">Add</Button></div>
        </form>
      </Card>

      {members.length === 0 ? (
        <Empty>Nobody added yet. The about page shows the business until someone is published here.</Empty>
      ) : (
        <ul className="space-y-4">
          {members.map((mem) => (
            <li key={mem.id}>
              <Card>
                <form action="/api/admin/team" method="post" className="grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="id" value={mem.id} />
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-teal font-display font-bold text-ink">
                      {mem.photo_url
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={mem.photo_url} alt="" className="h-full w-full object-cover" />
                        : mem.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="font-display text-lg font-bold">{mem.name}</span>
                    <Pill tone={mem.is_published ? "default" : "muted"}>
                      {mem.is_published ? "On the site" : "Draft"}
                    </Pill>
                  </div>
                  <Field label="Name" htmlFor={`n-${mem.id}`}>
                    <input id={`n-${mem.id}`} name="name" defaultValue={mem.name} required className={fieldCls} />
                  </Field>
                  <Field label="Role" htmlFor={`r-${mem.id}`}>
                    <input id={`r-${mem.id}`} name="role_title" defaultValue={mem.role_title ?? ""} className={fieldCls} />
                  </Field>
                  <Field label="Photo URL" htmlFor={`p-${mem.id}`} className="sm:col-span-2">
                    <input id={`p-${mem.id}`} name="photo_url" type="url"
                      defaultValue={mem.photo_url ?? ""} className={fieldCls} />
                  </Field>
                  <Field label="Bio" htmlFor={`b-${mem.id}`} className="sm:col-span-2">
                    <textarea id={`b-${mem.id}`} name="bio" rows={3}
                      defaultValue={mem.bio ?? ""} className={fieldCls} />
                  </Field>
                  <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="is_published" value="yes" defaultChecked={mem.is_published} />
                      Show on the site
                    </label>
                    <span className="ml-auto flex gap-2">
                      <Button>Save</Button>
                      <Button name="remove" value="yes">Remove</Button>
                    </span>
                  </div>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
