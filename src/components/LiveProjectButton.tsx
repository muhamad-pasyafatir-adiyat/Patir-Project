import { ArrowUpRight } from 'lucide-react'

export function LiveProjectButton() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full border-2 border-[#D7E2EA] px-8 py-3 text-sm font-medium uppercase tracking-[0.28em] text-[#D7E2EA] transition-colors duration-200 hover:bg-[#D7E2EA]/10 sm:px-10 sm:py-3.5 sm:text-base"
    >
      Live Project
      <ArrowUpRight size={18} strokeWidth={2.25} />
    </button>
  )
}
