import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, Repeat, Type } from "lucide-react"

interface AutomationPreferences {
  frequency: "daily" | "weekly" | "monthly"
  tone: string
  length: string
  count: number
}

interface AutomationPreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (preferences: AutomationPreferences) => void
}

export default function AutomationPreferencesModal({ isOpen, onClose, onConfirm }: AutomationPreferencesModalProps) {
  const { register, handleSubmit, setValue, watch } = useForm<AutomationPreferences>({
    defaultValues: {
      frequency: "daily",
      tone: "professional",
      length: "medium",
      count: 1,
    },
  })

  const onSubmit = (data: AutomationPreferences) => {
    onConfirm(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-[#2d3748] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            Automation Preferences
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="frequency" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Frequency
            </Label>
            <Select
              onValueChange={(value) => setValue("frequency", value as "daily" | "weekly" | "monthly")}
              defaultValue="daily"
            >
              <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 text-white border-gray-600">
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tone" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Type className="w-4 h-4" />
              Tone
            </Label>
            <Select
              onValueChange={(value) => setValue("tone", value)}
              defaultValue="professional"
            >
              <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 text-white border-gray-600">
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="inspirational">Inspirational</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="length" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Type className="w-4 h-4" />
              Length
            </Label>
            <Select
              onValueChange={(value) => setValue("length", value)}
              defaultValue="medium"
            >
              <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select length" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 text-white border-gray-600">
                <SelectItem value="short">Short (~50 words)</SelectItem>
                <SelectItem value="medium">Medium (~100 words)</SelectItem>
                <SelectItem value="long">Long (~200 words)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="count" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Number of Posts
            </Label>
            <Select
              onValueChange={(value) => setValue("count", parseInt(value))}
              defaultValue="1"
            >
              <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select number of posts" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 text-white border-gray-600">
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#0077B5] text-[#0077B5] hover:bg-[#0077B5]/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#004182] hover:to-[#0077B5] text-white"
            >
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}