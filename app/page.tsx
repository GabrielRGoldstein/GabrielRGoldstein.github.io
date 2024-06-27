import About from "@/components/About";
import Experience from "@/components/Experience";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Projects from "@/components/Projects";

export default function Home() {
  return (
    <main id = "portfolio">
      <Navbar/>
      <Hero/>
      <About/>
      <Experience/>
      <Projects/>

    </main>
  );
}
