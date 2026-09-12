import { Hero } from "@/components/marketing/hero";
import { TrustBar } from "@/components/marketing/trust-bar";
import { ProductDemoTabs } from "@/components/marketing/product-demo-tabs";
import { BentoFeatureGrid } from "@/components/marketing/bento-feature-grid";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Testimonials } from "@/components/marketing/testimonials";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { FinalCta } from "@/components/marketing/final-cta";

export default function MarketingHome() {
  return (
    <>
      <Hero />
      <TrustBar />
      <ProductDemoTabs />
      <BentoFeatureGrid />
      <HowItWorks />
      <Testimonials />
      <PricingSection />
      <FaqAccordion />
      <FinalCta />
    </>
  );
}
