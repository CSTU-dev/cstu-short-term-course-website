import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { COURSE_MODE_LABELS } from "@/lib/constants";
import { availableModes, hasBothModes, lowestPrice } from "@/lib/courses";
import { formatCurrency, formatDate } from "@/lib/format";

export type PublicCourse = {
  id: string;
  slug: string;
  title: string;
  startAt: Date | string;
  endAt: Date | string;
  hasOnline: boolean;
  hasOffline: boolean;
  onlinePrice: number | null;
  offlinePrice: number | null;
};

export function CourseCard({ course }: { course: PublicCourse }) {
  const from = lowestPrice(course);
  const showFrom = hasBothModes(course);

  return (
    <Card className="flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">{course.title}</CardTitle>
        <p className="font-mono text-xs tracking-[0.03em] text-muted-foreground">
          {formatDate(course.startAt)} – {formatDate(course.endAt)}
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="font-heading text-2xl font-bold text-ink dark:text-cream">
          {showFrom ? (
            <span className="text-muted-foreground mr-1 text-sm font-normal">
              From
            </span>
          ) : null}
          {from !== null ? formatCurrency(from) : "—"}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {availableModes(course).map((mode) => (
            <Badge key={mode} variant="secondary">
              {COURSE_MODE_LABELS[mode]}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Link
          href={`/courses/${course.slug}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Details
        </Link>
        <Link
          href={`/enroll?courseId=${course.id}`}
          className={buttonVariants()}
        >
          Enroll
        </Link>
      </CardFooter>
    </Card>
  );
}
