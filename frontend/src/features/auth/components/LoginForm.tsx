import React from "react"
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLoginViewModel } from "../hooks/useLoginViewModel"
import { useNavigate } from "react-router-dom"

interface LoginFormProps {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  className?: string
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  className = "",
}) => {
  const { viewModel, actions } = useLoginViewModel()
  const [showPassword, setShowPassword] = React.useState(false)
  const navigate = useNavigate()

  const handleLoginSuccess = () => {
    navigate("/dashboard", { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await actions.handleLogin()
    if (result.success) {
      onSuccess?.(result.data)
      handleLoginSuccess()
    } else if (result.error) {
      onError?.(result.error)
    }
  }

  return (
    <div className={`w-full max-w-md space-y-6 ${className}`}>
      {}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Admin Access</h1>
        <p className="text-muted-foreground">
          Sign in with your administrator account to continue
        </p>
      </div>

      {}
      {viewModel.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>
            {viewModel.errorMessage ||
              "Login failed. Please check your credentials and try again."}
          </AlertDescription>
        </Alert>
      )}

      {}
      <form onSubmit={handleSubmit} className="space-y-4">
        {}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your admin email"
              value={viewModel.formData.email}
              onChange={(e) => actions.updateField("email", e.target.value)}
              disabled={viewModel.status === "loading"}
              className="pl-10"
            />
          </div>
          {viewModel.validationErrors.email && (
            <p className="text-sm text-destructive">{viewModel.validationErrors.email}</p>
          )}
        </div>

        {}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={viewModel.formData.password}
              onChange={(e) => actions.updateField("password", e.target.value)}
              disabled={viewModel.status === "loading"}
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {viewModel.validationErrors.password && (
            <p className="text-sm text-destructive">{viewModel.validationErrors.password}</p>
          )}
        </div>

        {}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={viewModel.formData.rememberMe}
            onCheckedChange={(checked) =>
              actions.updateField("rememberMe", !!checked)
            }
            disabled={viewModel.status === "loading"}
          />
          <Label htmlFor="rememberMe" className="text-sm">
            Remember me
          </Label>
        </div>

        {}
        <Button
          type="submit"
          className="w-full"
          disabled={!viewModel.canSubmit || viewModel.status === "loading"}
        >
          {viewModel.status === "loading" ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              Signing in...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </div>
          )}
        </Button>
      </form>
    </div>
  )
}
