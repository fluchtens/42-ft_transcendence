import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import config from "../../config.json";

const HomeCard = ({ title, desc }: { title: string; desc: string }) => {
  return (
    <div className="w-full h-auto flex-1 rounded-lg bg-card border p-6 shadow">
      <h2 className="text-xl font-semibold text-card-foreground">{title}</h2>
      <p className="text-sm font-normal text-muted-foreground">{desc}</p>
    </div>
  );
};

const FaqQuestion = ({ value, question, answer }: { value: string; question: string; answer: string }) => {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="text-base font-semibold text-foreground text-left">{question}</AccordionTrigger>
      <AccordionContent className="text-sm font-normal text-muted-foreground text-left">{answer}</AccordionContent>
    </AccordionItem>
  );
};

function Home() {
  return (
    <div className="md:py-16 m-auto max-w-screen-lg flex flex-col items-center gap-6 md:gap-16">
      <div className="text-center">
        <h1 className="text-3xl md:text-5xl font-semibold">ft_transcendence</h1>
        <h2 className="mt-1 text-base md:text-xl font-extralight">Modern multiplayer pong game</h2>
        <Button className="mt-3" size="lg" asChild>
          <Link to="/game" className="font-semibold">
            Play Now
          </Link>
        </Button>
      </div>
      <div className="w-full flex-col md:flex-row flex gap-4">
        {config.card.map((card, index) => (
          <HomeCard key={index} title={card.title} desc={card.description} />
        ))}
      </div>
      <div className="w-full flex-col flex gap-1">
        <h1 className="text-2xl font-semibold text-foreground">FAQ</h1>
        <Accordion type="single" collapsible className="w-full">
          {config.faq.map((question, index) => (
            <FaqQuestion key={index} value={index.toString()} question={question.question} answer={question.answer} />
          ))}
        </Accordion>
      </div>
    </div>
  );
}

export default Home;
