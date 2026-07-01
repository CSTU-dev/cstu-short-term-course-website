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
import { formatCurrency, formatDate } from "@/lib/format";

export type PublicCourse = {
  id: string;
  slug: string;
  title: string;
  startAt: Date | string;
  endAt: Date | string;
  priceAmount: number;
  currency: string;
  isOffline: boolean;
};

export function CourseCard({ course }: { course: PublicCourse }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{course.title}</CardTitle>
        <p className="text-muted-foreground text-sm">
          {formatDate(course.startAt)} – {formatDate(course.endAt)}
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-2xl font-semibold">
          {formatCurrency(course.priceAmount, course.currency)}
        </p>
        {course.isOffline ? (
          <Badge variant="secondary" className="mt-2">
            Offline
          </Badge>
        ) : null}
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
