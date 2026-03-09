import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSend = vi.fn()

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}))

vi.mock('@react-email/components', () => ({
  render: vi.fn().mockResolvedValue('<html>rendered</html>'),
}))

vi.mock('@planfortwo/email', () => ({
  WelcomeEmail: vi.fn().mockReturnValue('WelcomeEmailComponent'),
  PartnerInviteEmail: vi.fn().mockReturnValue('PartnerInviteEmailComponent'),
}))

import { emailService } from './email.js'
import { render } from '@react-email/components'
import { WelcomeEmail, PartnerInviteEmail } from '@planfortwo/email'

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-setup render mock after clearing
    ;(render as ReturnType<typeof vi.fn>).mockResolvedValue('<html>rendered</html>')
    ;(WelcomeEmail as ReturnType<typeof vi.fn>).mockReturnValue('WelcomeEmailComponent')
    ;(PartnerInviteEmail as ReturnType<typeof vi.fn>).mockReturnValue('PartnerInviteEmailComponent')
  })

  describe('sendWelcome', () => {
    it('should skip when RESEND_API_KEY is not set', async () => {
      vi.stubEnv('RESEND_API_KEY', '')
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await emailService.sendWelcome('jane@example.com', 'Jane')

      expect(mockSend).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        '[email] RESEND_API_KEY not configured — skipping welcome email',
      )

      consoleSpy.mockRestore()
      vi.unstubAllEnvs()
    })

    it('should send welcome email successfully', async () => {
      vi.stubEnv('RESEND_API_KEY', 'test_resend_api_key')
      mockSend.mockResolvedValue({ error: null })

      await emailService.sendWelcome('jane@example.com', 'Jane')

      expect(WelcomeEmail).toHaveBeenCalledWith({ firstName: 'Jane' })
      expect(render).toHaveBeenCalled()
      expect(mockSend).toHaveBeenCalledWith({
        from: 'PlanForTwo <noreply@planfortwo.com>',
        to: 'jane@example.com',
        subject: 'Welcome to PlanForTwo!',
        html: '<html>rendered</html>',
      })

      vi.unstubAllEnvs()
    })

    it('should throw on Resend error', async () => {
      vi.stubEnv('RESEND_API_KEY', 'test_resend_api_key')
      mockSend.mockResolvedValue({
        error: { message: 'Invalid recipient' },
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(emailService.sendWelcome('bad@example.com', 'Bad')).rejects.toThrow(
        'Failed to send welcome email: Invalid recipient',
      )

      consoleSpy.mockRestore()
      vi.unstubAllEnvs()
    })
  })

  describe('sendPartnerInvite', () => {
    it('should skip when RESEND_API_KEY is not set', async () => {
      vi.stubEnv('RESEND_API_KEY', '')
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await emailService.sendPartnerInvite(
        'partner@example.com',
        'Jane',
        'https://planfortwo.com/invite?token=abc',
      )

      expect(mockSend).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        '[email] RESEND_API_KEY not configured — skipping partner invite email',
        expect.objectContaining({
          to: '*******************',
          subject: 'Jane invited you to plan your wedding on PlanForTwo',
        }),
      )

      consoleSpy.mockRestore()
      vi.unstubAllEnvs()
    })

    it('should send partner invite email successfully', async () => {
      vi.stubEnv('RESEND_API_KEY', 'test_resend_api_key')
      mockSend.mockResolvedValue({ error: null })

      await emailService.sendPartnerInvite(
        'partner@example.com',
        'Jane',
        'https://planfortwo.com/invite?token=abc',
      )

      expect(PartnerInviteEmail).toHaveBeenCalledWith({
        inviterName: 'Jane',
        inviteUrl: 'https://planfortwo.com/invite?token=abc',
      })
      expect(render).toHaveBeenCalled()
      expect(mockSend).toHaveBeenCalledWith({
        from: 'PlanForTwo <noreply@planfortwo.com>',
        to: 'partner@example.com',
        subject: 'Jane invited you to plan your wedding on PlanForTwo',
        html: '<html>rendered</html>',
      })

      vi.unstubAllEnvs()
    })

    it('should throw on Resend error', async () => {
      vi.stubEnv('RESEND_API_KEY', 'test_resend_api_key')
      mockSend.mockResolvedValue({
        error: { message: 'Rate limit exceeded' },
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(
        emailService.sendPartnerInvite(
          'partner@example.com',
          'Jane',
          'https://planfortwo.com/invite?token=abc',
        ),
      ).rejects.toThrow('Failed to send partner invite email: Rate limit exceeded')

      consoleSpy.mockRestore()
      vi.unstubAllEnvs()
    })
  })
})
