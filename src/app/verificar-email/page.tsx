import { VerifyEmailClient } from "@/components/auth/verify-email-client";

type VerifyEmailPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function getParam(
  searchParams: VerifyEmailPageProps["searchParams"],
  key: string
) {
  return typeof searchParams[key] === "string" ? searchParams[key] : "";
}

export default function VerifyEmailPage({
  searchParams
}: VerifyEmailPageProps) {
  const token = getParam(searchParams, "token");

  return <VerifyEmailClient token={token} />;
}
