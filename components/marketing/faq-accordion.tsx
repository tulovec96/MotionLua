import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "@/components/marketing/animate-in";

const FAQS = [
  {
    q: "Is this safe for my account?",
    a: "RobloAI signs you in through Roblox's own OAuth 2.0 flow — the same one Roblox uses for Open Cloud apps. We never see or store your password.",
  },
  {
    q: "Does it work with free Roblox accounts?",
    a: "Yes. Any Roblox account can sign in and start on the Free plan; no Roblox Premium or payment is required to try RobloAI.",
  },
  {
    q: "What happens when I run out of tokens?",
    a: "New AI requests are blocked with a clear upgrade prompt until your monthly cycle renews or you top up with a token pack — your existing scripts and projects are never affected.",
  },
  {
    q: "Can I use my own API key?",
    a: "Bring-your-own-key support is on the roadmap for Pro and Ultra plans. For now, all requests run on RobloAI's managed Claude access.",
  },
  {
    q: "Does it import marketplace assets?",
    a: "Yes — models, sounds, animations, meshes, and bundles from the Roblox Creator Store, searchable and importable directly from chat.",
  },
  {
    q: "How do I install the plugin?",
    a: "Install it from the Roblox Studio plugin marketplace, then pair it with your account from Settings → Plugin using a short pairing code.",
  },
  {
    q: "What's the difference between plans?",
    a: "Plans control which Claude model powers your chat (Haiku, Sonnet, or Opus with extended thinking) and how many tokens you get each month.",
  },
];

export function FaqAccordion() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <Reveal className="mb-10 text-center">
        <h2 className="font-heading text-3xl font-semibold sm:text-4xl">Frequently asked questions</h2>
      </Reveal>
      <Reveal>
        <Accordion className="w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-heading">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
