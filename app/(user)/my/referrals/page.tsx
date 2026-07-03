import { ChangeCodeForm } from "@/components/referral/change-code-form";
import { ReferralLinkTools } from "@/components/referral/referral-link-tools";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/guards";
import { formatCurrency } from "@/lib/format";
import { getReferralOverview } from "@/lib/referral/service";

export const metadata = { title: "Referrals" };

export default async function ReferralsPage() {
  const session = await requireRole("USER");
  const data = await getReferralOverview(session.user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Referrals</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your referral code</CardTitle>
            <CardDescription>
              Share course links to earn commission.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-md px-3 py-2 font-mono text-lg font-semibold">
              {data.primaryCode}
            </div>
            <ChangeCodeForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Clicks" value={String(data.totals.clicks)} />
            <Stat label="Sales" value={String(data.totals.conversions)} />
            <Stat
              label="Commission"
              value={formatCurrency(data.totals.commission)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By course</CardTitle>
        </CardHeader>
        <CardContent>
          {data.rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No courses yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row) => (
                    <TableRow key={row.courseId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{row.title}</span>
                          {!row.enabled ? (
                            <Badge variant="secondary">Closed</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ReferralLinkTools link={row.link} label={row.slug} />
                      </TableCell>
                      <TableCell className="text-right">{row.clicks}</TableCell>
                      <TableCell className="text-right">
                        {row.conversions}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.commission)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}
