import { withAuth } from "next-auth/middleware";

const proxy = withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => {
      return Boolean(token);
    },
  },
});

export default proxy;

export const config = {
  matcher: ["/admin/:path*"],
};
