"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Category } from "@/data/categories";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  category: Category;
  index: number;
}

export function CategoryCard({ category, index }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={`/try-on?category=${category.id}`}
        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 block"
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
        
        {/* Content */}
        <div className="relative p-6 sm:p-8 flex flex-col items-center text-center space-y-3 sm:space-y-4">
          {/* Icon */}
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="text-5xl sm:text-6xl mb-2"
          >
            {category.icon}
          </motion.div>
          
          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
            {category.name}
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 text-sm">
            {category.description}
          </p>
          
          {/* CTA Button */}
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors pt-2">
            Try Now
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
        
        {/* Decorative Corner */}
        <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${category.gradient} opacity-20 blur-2xl`} />
      </Link>
    </motion.div>
  );
}
