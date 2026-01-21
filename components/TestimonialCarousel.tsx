"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

const testimonials = [
  {
    id: 1,
    name: "Tino Nguruve",
    username: "@tino",
    avatar: "TN",
    content:
      "LinkedPilot transformed my LinkedIn game completely. My engagement increased by 300% in just one month. The AI really captures my voice perfectly!",
    rating: 5,
  },
  {
    id: 2,
    name: "Sarah Chen",
    username: "@sarahc",
    avatar: "SC",
    content:
      "As a busy entrepreneur, LinkedPilot saves me hours every week. The content quality is incredible and my network has grown by 500+ connections!",
    rating: 5,
  },
  {
    id: 3,
    name: "Marcus Johnson",
    username: "@marcusj",
    avatar: "MJ",
    content:
      "I was skeptical about AI-generated content, but LinkedPilot proved me wrong. My posts now get 10x more comments and shares. Game changer!",
    rating: 5,
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    username: "@emilyrod",
    avatar: "ER",
    content:
      "LinkedPilot helped me land my dream job! The consistent, high-quality posts showcased my expertise and attracted recruiters. Highly recommend!",
    rating: 5,
  },
]

export default function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <div className="max-w-2xl mx-auto relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="bg-card p-8 rounded-xl border border-border relative"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
        >
          <Quote className="w-12 h-12 text-primary mb-4" />
          <p className="text-lg mb-6 leading-relaxed text-foreground">"{currentTestimonial.content}"</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                {currentTestimonial.avatar}
              </div>
              <div>
                <div className="font-semibold text-foreground">{currentTestimonial.name}</div>
                <div className="text-muted-foreground text-sm">{currentTestimonial.username}</div>
              </div>
            </div>
            <div className="flex text-yellow-500">
              {[...Array(currentTestimonial.rating)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={prevTestimonial}
          className="w-12 h-12 rounded-full border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={nextTestimonial}
          className="w-12 h-12 rounded-full border-primary bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
