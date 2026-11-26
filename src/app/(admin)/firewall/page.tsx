"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Globe, MapPin, Plus, ShieldCheck, X } from "lucide-react";
import { Badge, Button, Callout, Card, CardBody, CardHeader, EmptyState, Input, PageHeader, SaveBar, Skeleton, useConfirm } from "@/components/ui";
import { useAction } from "@/hooks/useAction";
import { useDraft } from "@/hooks/useDraft";
import { useQuery } from "@/hooks/useQuery";
import { adminApi } from "@/lib/api";
import { ipMatches, isIpv4OrCidr } from "@/lib/validate";

const MAX_ENTRIES = 200;
const isIpv4 = (ip: string | null): ip is string => !!ip && isIpv4OrCidr(ip) && !ip.includes("/");

export default function FirewallPage() {
  const q = useQuery("firewall", (s) => adminApi.firewall.get(s));
  const base = useMemo(() => (q.data ? { allowlist: q.data.allowlist } : null), [q.data]);
  const { draft, set, reset, dirty } = useDraft(base);
  const { run, isPending } = useAction();
  const confirm = useConfirm();
  const [entry, setEntry] = useState("");
  const [entryError, setEntryError] = useState<string | null>(null);

  const list = draft?.allowlist ?? [];
  const clientIp = q.data?.client_ip ?? null;
  const myIpListed = isIpv4(clientIp) && list.some((e) => ipMatches(clientIp, e));
  const wouldLockOut = list.length > 0 && !myIpListed;

  const add = (raw: string) => {
    const value = raw.trim();
    if (!isIpv4OrCidr(value)) return setEntryError("Enter an IPv4 address like 203.0.113.7 or a range like 203.0.113.0/24.");
    if (list.includes(value)) return setEntryError("Already on the list.");
    if (list.length >= MAX_ENTRIES) return setEntryError(`The list holds up to ${MAX_ENTRIES} entries.`);
    set("allowlist", [...list, value]);
    setEntry("");
    setEntryError(null);
  };
  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    add(entry);
  };
  const remove = (value: string) => set("allowlist", list.filter((x) => x !== value));

  const save = async () => {
    if (!draft) return;
    if (wouldLockOut) {
      const ok = await confirm({
        title: "Save without your IP?",
        description: isIpv4(clientIp)
          ? `Your current IP (${clientIp}) isn't on the list. You'll stay signed in, but you won't be able to sign in again from here.`
          : "Your connection can't be matched (it isn't IPv4). You'll stay signed in, but you won't be able to sign in again from here.",
        confirmLabel: "Save anyway",
      });
      if (!ok) return;
    }
    const res = await run("save", () => adminApi.firewall.update(draft.allowlist), {
      success: draft.allowlist.length ? "Allowlist saved" : "Allowlist cleared: sign-in open from any IP",
      errorTitle: "Couldn't save",
    });
    if (res) q.setData(res);
  };

  return (
    <>
      <PageHeader title="IP allowlist" description="Limit where admins can sign in from. Doesn't affect app users." />
      {q.error ? <Callout tone="danger" className="mb-4">{q.error}</Callout> : null}

      {!draft ? (
        <Skeleton className="h-80" />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
          <Card>
            <CardHeader
              icon={<ShieldCheck size={18} />}
              title="Allowed addresses"
              description={list.length ? `${list.length} of ${MAX_ENTRIES}. Only these can sign in.` : "Empty: admins can sign in from anywhere."}
              actions={list.length ? <Badge tone="brand">Restricted</Badge> : <Badge tone="neutral">Open</Badge>}
            />
            <CardBody className="space-y-4">
              <form onSubmit={onAdd} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <Input
                    aria-label="IP address or range"
                    placeholder="203.0.113.7 or 203.0.113.0/24"
                    value={entry}
                    invalid={!!entryError}
                    onChange={(e) => {
                      setEntry(e.target.value);
                      setEntryError(null);
                    }}
                    className="font-mono text-[13px]"
                  />
                  {entryError ? <p className="mt-1.5 text-xs font-medium text-danger">{entryError}</p> : null}
                </div>
                <Button type="submit" icon={<Plus size={16} />} disabled={!entry.trim()}>Add</Button>
              </form>

              {list.length ? (
                <ul className="flex flex-wrap gap-2">
                  {list.map((value) => {
                    const mine = isIpv4(clientIp) && ipMatches(clientIp, value);
                    return (
                      <li key={value} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-muted py-1 pl-3 pr-1 font-mono text-[13px] text-ink">
                        {value}
                        {mine ? <span className="font-sans text-[11px] font-semibold text-brand">you</span> : null}
                        <button
                          type="button"
                          onClick={() => remove(value)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-danger-soft hover:text-danger"
                          aria-label={`Remove ${value}`}
                        >
                          <X size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState icon={<Globe size={22} />} title="No restrictions" description="Add your office or VPN address to allow sign-in only from there." className="py-8" />
              )}

              {wouldLockOut ? (
                <Callout tone="danger" title="Your IP isn't on this list">
                  Saving it like this blocks your next sign-in from this connection.
                </Callout>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<MapPin size={18} />} title="Your connection" />
            <CardBody className="space-y-4 text-sm">
              <div>
                <div className="text-xs font-medium text-muted">Current IP</div>
                <div className="mt-1 break-all font-mono text-[15px] font-semibold text-ink">{clientIp ?? "Unknown"}</div>
              </div>
              {isIpv4(clientIp) ? (
                myIpListed ? (
                  <Badge tone="success" dot>Allowed</Badge>
                ) : (
                  <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => add(clientIp)}>Add my IP</Button>
                )
              ) : (
                <p className="text-xs leading-relaxed text-warning">This isn&apos;t an IPv4 address, so it can&apos;t be allowlisted. With any entries on the list, sign-in from here is blocked.</p>
              )}
              <ul className="space-y-2 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                <li>Checked only when an admin signs in. Open sessions keep working.</li>
                <li>IPv4 addresses and CIDR ranges (like /24) only.</li>
                <li>An empty list allows sign-in from anywhere.</li>
              </ul>
            </CardBody>
          </Card>
        </div>
      )}

      <SaveBar count={dirty.length ? 1 : 0} saving={isPending("save")} onSave={() => void save()} onReset={reset} />
    </>
  );
}
