import Script from "next/script"
import { CONFIG } from "site.config"

const Scripts: React.FC = () => (
  <>
    {CONFIG?.goatCounter?.enable === true &&
      (CONFIG.goatCounter.host || CONFIG.goatCounter.code) && (
        <Script
          data-goatcounter={`https://${CONFIG.goatCounter.host || `${CONFIG.goatCounter.code}.goatcounter.com`}/count`}
          async
          src="https://gc.zgo.at/count.js"
        />
      )}

    {CONFIG?.googleAnalytics?.enable === true && (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${CONFIG.googleAnalytics.config.measurementId}`}
        />
        <Script strategy="lazyOnload" id="ga">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${CONFIG.googleAnalytics.config.measurementId}', {
              page_path: window.location.pathname,
            });`}
        </Script>
      </>
    )}
  </>
)

export default Scripts
