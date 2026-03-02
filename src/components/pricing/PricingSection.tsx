import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BoltIcon from '@mui/icons-material/Bolt';
import DevicesIcon from '@mui/icons-material/Devices';

/* ---------- Data ---------- */

interface PricingTier {
  name: string;
  monthlyPrice: number | null; // null = custom/enterprise
  annualPrice: number | null;
  tokens: string;
  devices: string;
  models: string;
  color: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    monthlyPrice: 49,
    annualPrice: 39,
    tokens: '250K tokens/mo',
    devices: '3 devices',
    models: 'Haiku + Sonnet',
    color: '#06b6d4',
    features: ['All 6 spark types', 'Manual checkpoints', '1 social platform', 'Community support'],
    cta: 'Start Free Trial',
    ctaHref: 'https://auth.tacticl.ai/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 129,
    annualPrice: 99,
    tokens: '750K tokens/mo',
    devices: '10 devices',
    models: 'All models',
    color: '#6C63FF',
    features: ['Everything in Starter', 'All AI models', 'Scheduling', '3 social platforms', 'Email support (48h)'],
    cta: 'Start Free Trial',
    ctaHref: 'https://auth.tacticl.ai/signup',
    highlighted: true,
  },
  {
    name: 'Max',
    monthlyPrice: 349,
    annualPrice: 279,
    tokens: '2.5M tokens/mo',
    devices: 'Unlimited devices',
    models: 'All + priority routing',
    color: '#8b5cf6',
    features: ['Everything in Pro', 'Priority routing', 'Recurring schedules', 'Unlimited social platforms', 'Priority support (4h)', 'BYOK option'],
    cta: 'Start Free Trial',
    ctaHref: 'https://auth.tacticl.ai/signup',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    tokens: 'Custom allocation',
    devices: 'Unlimited devices',
    models: 'All + dedicated',
    color: '#ec4899',
    features: ['Everything in Max', 'Dedicated queue', 'Custom checkpoint policies', 'API access', 'Dedicated CSM'],
    cta: 'Contact Sales',
    ctaHref: 'mailto:sales@tacticl.ai',
    highlighted: false,
  },
];

/* ---------- Component ---------- */

interface PricingSectionProps {
  id?: string;
}

export default function PricingSection({ id }: PricingSectionProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  return (
    <Box
      component="section"
      id={id}
      sx={{ bgcolor: '#0F0F23', py: { xs: 8, md: 12 } }}
    >
      <Container maxWidth="lg">
        {/* Section header */}
        <Typography
          variant="h3"
          sx={{
            textAlign: 'center',
            fontWeight: 700,
            fontSize: { xs: '1.75rem', md: '2.25rem' },
            mb: 2,
            letterSpacing: '-0.02em',
          }}
        >
          Simple, transparent pricing
        </Typography>
        <Typography
          sx={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            mb: { xs: 4, md: 5 },
            maxWidth: 560,
            mx: 'auto',
          }}
        >
          All plans include a 14-day free trial. No charge until day 15.
        </Typography>

        {/* Billing toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 5, md: 6 } }}>
          <ToggleButtonGroup
            value={billing}
            exclusive
            onChange={(_, value) => {
              if (value) setBilling(value);
            }}
            sx={{
              bgcolor: 'rgba(255,255,255,0.04)',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.08)',
              p: 0.5,
              '& .MuiToggleButtonGroup-grouped': {
                border: 'none',
                borderRadius: '999px !important',
                px: 3,
                py: 1,
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'none',
                '&.Mui-selected': {
                  bgcolor: 'rgba(108,99,255,0.2)',
                  color: '#fff',
                },
                '&.Mui-selected:hover': {
                  bgcolor: 'rgba(108,99,255,0.25)',
                },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.05)',
                },
              },
            }}
          >
            <ToggleButton value="monthly">Monthly</ToggleButton>
            <ToggleButton value="annual">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Annual
                <Chip
                  label="Save 20%"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(3,218,198,0.15)',
                    color: '#03DAC6',
                    border: '1px solid rgba(3,218,198,0.3)',
                  }}
                />
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Tier cards */}
        <Grid container spacing={3}>
          {tiers.map((tier) => {
            const price = billing === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
            const isEnterprise = price === null;

            return (
              <Grid key={tier.name} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box
                  sx={{
                    p: 4,
                    borderRadius: '16px',
                    border: tier.highlighted
                      ? '1px solid rgba(108,99,255,0.5)'
                      : '1px solid rgba(255,255,255,0.06)',
                    bgcolor: tier.highlighted
                      ? 'rgba(108,99,255,0.05)'
                      : 'rgba(255,255,255,0.02)',
                    boxShadow: tier.highlighted
                      ? '0 0 40px rgba(108,99,255,0.15)'
                      : 'none',
                    height: '100%',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      border: '1px solid rgba(108,99,255,0.3)',
                      bgcolor: 'rgba(108,99,255,0.05)',
                      boxShadow: '0 0 30px rgba(108,99,255,0.1)',
                    },
                  }}
                >
                  {/* Most Popular chip */}
                  {tier.highlighted && (
                    <Chip
                      label="Most Popular"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -14,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1,
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        letterSpacing: '0.05em',
                        bgcolor: '#6C63FF',
                        color: '#fff',
                        px: 1,
                      }}
                    />
                  )}

                  {/* Tier name */}
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: tier.color,
                      mb: 2,
                    }}
                  >
                    {tier.name}
                  </Typography>

                  {/* Price */}
                  {isEnterprise ? (
                    <Box sx={{ mb: 0.5 }}>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: { xs: '2.5rem', md: '3rem' },
                          lineHeight: 1,
                        }}
                      >
                        Custom
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ mb: 0.5 }}>
                      {billing === 'annual' && tier.monthlyPrice !== null && (
                        <Typography
                          sx={{
                            fontSize: '0.85rem',
                            color: 'rgba(255,255,255,0.35)',
                            textDecoration: 'line-through',
                          }}
                        >
                          ${tier.monthlyPrice}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: { xs: '2.5rem', md: '3rem' },
                            lineHeight: 1,
                          }}
                        >
                          ${price}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            color: 'rgba(255,255,255,0.4)',
                            ml: 0.5,
                          }}
                        >
                          /mo
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Billing subtitle */}
                  <Typography
                    sx={{
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.4)',
                      mb: 3,
                    }}
                  >
                    {isEnterprise
                      ? 'Contact us for pricing'
                      : billing === 'monthly'
                        ? 'billed monthly'
                        : 'billed annually'}
                  </Typography>

                  {/* Divider */}
                  <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', my: 3 }} />

                  {/* Tokens */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <BoltIcon sx={{ fontSize: 18, color: tier.color }} />
                    <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                      {tier.tokens}
                    </Typography>
                  </Box>

                  {/* Devices */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <DevicesIcon sx={{ fontSize: 18, color: tier.color }} />
                    <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                      {tier.devices}
                    </Typography>
                  </Box>

                  {/* Models */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0 }}>
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: tier.color,
                        border: `1.5px solid ${tier.color}`,
                        borderRadius: '4px',
                      }}
                    >
                      AI
                    </Box>
                    <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                      {tier.models}
                    </Typography>
                  </Box>

                  {/* Divider */}
                  <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', my: 3 }} />

                  {/* Features */}
                  <Box sx={{ flex: 1, mb: 4 }}>
                    {tier.features.map((feature) => (
                      <Box
                        key={feature}
                        sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}
                      >
                        <CheckCircleOutlineIcon
                          sx={{ fontSize: 18, color: tier.color, mt: '2px', flexShrink: 0 }}
                        />
                        <Typography
                          sx={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}
                        >
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* CTA button */}
                  <Button
                    variant={tier.highlighted ? 'contained' : 'outlined'}
                    fullWidth
                    href={tier.ctaHref}
                    sx={{
                      py: 1.5,
                      borderRadius: '12px',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      ...(tier.highlighted
                        ? {
                            background: 'linear-gradient(135deg, #6C63FF 0%, #8b5cf6 100%)',
                            boxShadow: '0 4px 24px rgba(108,99,255,0.35)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #7C73FF 0%, #9b6cf6 100%)',
                              boxShadow: '0 6px 32px rgba(108,99,255,0.5)',
                            },
                          }
                        : {
                            borderColor: 'rgba(255,255,255,0.2)',
                            color: 'rgba(255,255,255,0.8)',
                            '&:hover': {
                              borderColor: 'rgba(108,99,255,0.5)',
                              bgcolor: 'rgba(108,99,255,0.05)',
                            },
                          }),
                    }}
                  >
                    {tier.cta}
                  </Button>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}
