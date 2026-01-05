# Chip Economy Documentation

## Chip Value Definition

**1 Chip = 1 Philippine Peso (₱1.00)**

This equivalence is used for:
- Display purposes (showing chip values in peso format)
- User understanding and reference
- Payment processing calculations
- Market volume and statistics display

## Important Legal & Business Notes

### Chips Are Non-Redeemable
- Chips are **virtual tokens** with **no monetary value**
- Chips **cannot be converted to cash** or redeemed for real money
- The 1:1 ratio with Philippine Peso is for **reference purposes only**

### Legal Compliance
- This equivalence does NOT mean chips have monetary value
- Chips cannot be withdrawn, cashed out, or redeemed
- All chip transactions are final and non-refundable
- Terms of Service must clearly state chips have no monetary value

### Display & User Experience
- When displaying chip amounts, show as: `₱1,000` or `1,000 chips`
- Use peso symbol (₱) for better user understanding
- Always include disclaimer that chips are non-redeemable

### Payment Processing
- When users purchase chips, charge in Philippine Pesos
- Example: User buys 1,000 chips → Charge ₱1,000.00
- Stripe/payment processor handles actual currency conversion if needed

### Market Volume & Statistics
- Market volume can be displayed in both chips and peso equivalent
- Example: "Total Volume: 50,000 chips (₱50,000)"
- This helps users understand market size in familiar currency terms

## Implementation Notes

### Backend
- Constant defined in `backend/app/config.py`: `CHIP_TO_PESO_RATIO = 1.0`
- Use this constant for any chip-to-peso conversions
- Always include disclaimers in API responses when showing peso values

### Frontend
- Display chip amounts with peso symbol for clarity
- Show both formats: "1,000 chips (₱1,000)"
- Include tooltips or help text explaining chips are non-redeemable

### Database
- Store chip amounts as integers (representing number of chips)
- No need to store peso values separately (calculate on-the-fly)
- Example: `chips: 1000` means 1,000 chips = ₱1,000

## Examples

### User Balance Display
```
Chips: 5,000 (₱5,000.00)
```

### Market Volume Display
```
Total Volume: 250,000 chips (₱250,000)
```

### Purchase Confirmation
```
You purchased 10,000 chips for ₱10,000.00
```

### Forecast Display
```
You allocated 500 chips (₱500) to "Yes"
```

## Revision History

- **2025-01-05**: Documented that 1 Chip = 1 Philippine Peso (₱1.00)
  - Added to README.md
  - Added to PROJECT_PLAN.md
  - Added constant to backend/app/config.py
  - Created this dedicated documentation file

