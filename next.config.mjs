import createNextIntlPlugin from "next-intl/plugin";

const config = {
  async headers() {
    return [
      { source: "/:path*", headers: [
        {key:"Referrer-Policy",value:"no-referrer"},
        {key:"X-Content-Type-Options",value:"nosniff"},
        {key:"X-Frame-Options",value:"DENY"},
      ] },
      ...["/e/:path*","/organizer/:path*"].map(source=>({source,headers:[
        {key:"X-Robots-Tag",value:"noindex, nofollow"},
        {key:"Cache-Control",value:"private, no-store"},
      ]})),
    ];
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(config);
