import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { TRANSLATIONS } from '../data/mockData';
import { formatCurrencyValue, getExchangeRate } from './LanguageCurrency';
import { CreditCard, Smartphone, CheckCircle, ArrowLeft, Loader2, ShieldCheck, DollarSign } from 'lucide-react';

interface CheckoutModalProps {
  language: 'pt' | 'en' | 'es' | 'fr';
  currency: string;
  cart: { product: Product; quantity: number }[];
  shippingDetails: {
    countryCode: string;
    postalCode: string;
    carrierId: string;
    shippingCost: number;
    warehouseId: string;
    warehouseName: string;
    warehouseCity: string;
    distanceKm: number;
  } | null;
  onClose: () => void;
  onOrderSuccess: (trackingCode: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  language,
  currency,
  cart,
  shippingDetails,
  onClose,
  onOrderSuccess
}) => {
  const t = TRANSLATIONS[language];

  // Merchant Settings (Kivento details)
  const [settings, setSettings] = useState<any>({
    bankName: 'Kivento Bank (Caixa Geral de Depósitos)',
    accountHolder: 'Kivento Lda',
    iban: 'PT50 0035 0123 4567 8901 2345 6',
    swift: 'CGDIPTPLXXX',
    mbwayPhone: '912345678',
    profitMarginMarkup: 30
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Error loading merchant settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Client Info Form
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Payment configuration
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'card'>('mbway');
  const [mbWayPhone, setMbWayPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [mbwayApproving, setMbwayApproving] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const cartSubtotal = cart.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);
  const shippingCost = shippingDetails?.shippingCost || 0;
  const exchangeRate = getExchangeRate(currency);
  
  // Convert subtotal & shipping cost to currently selected currency
  const convertedSubtotal = Math.round(cartSubtotal * exchangeRate * 100) / 100;
  const convertedShipping = Math.round(shippingCost * exchangeRate * 100) / 100;
  const convertedTotal = convertedSubtotal + convertedShipping;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingDetails) return;

    if (paymentMethod === 'mbway' && !mbWayPhone) {
      setErrorMsg(language === 'pt' ? 'Insira o número de telemóvel do MB Way.' : 'Insert MB Way mobile number.');
      return;
    }
    if (paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCvv)) {
      setErrorMsg(language === 'pt' ? 'Preencha todos os dados do cartão de crédito.' : 'Fill in all credit card details.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        customerName,
        email,
        phone,
        address,
        postalCode: shippingDetails.postalCode,
        city,
        countryCode: shippingDetails.countryCode,
        items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
        paymentMethod,
        paymentPhone: paymentMethod === 'mbway' ? mbWayPhone : undefined,
        paymentCard: paymentMethod === 'card' ? cardNumber : undefined,
        carrierId: shippingDetails.carrierId,
        warehouseId: shippingDetails.warehouseId,
        shippingCost: convertedShipping,
        currency,
        exchangeRate
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedOrder(data.order);
        
        // Custom interactive flow: if MB Way, show push approval screen!
        if (paymentMethod === 'mbway') {
          setMbwayApproving(true);
          // Simulate 5 seconds for user to tap approval on phone
          setTimeout(() => {
            setMbwayApproving(false);
            setPaymentSuccess(true);
          }, 5000);
        } else {
          // Card payment success immediate
          setPaymentSuccess(true);
        }
      } else {
        const errData = await response.json();
        setErrorMsg(errData.error || 'Erro ao processar pagamento.');
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg('Falha de rede ao tentar finalizar pedido.');
      setLoading(false);
    }
  };

  if (paymentSuccess && createdOrder) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto text-center space-y-6 shadow-md animate-fade-in" id="checkout-success-view">
        <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100" id="success-icon-wrapper">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>

        <div className="space-y-2" id="success-header">
          <h3 className="text-xl font-bold text-slate-900">{t.order_success}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {language === 'pt' 
              ? 'O seu pedido europeu foi registado e enviado para o armazém regional correspondente.'
              : 'Your European order was registered and routed to the corresponding regional warehouse.'}
          </p>
        </div>

        {/* Order Details Panel */}
        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-left space-y-3.5 font-sans" id="success-order-details">
          <div className="flex justify-between items-center" id="detail-code">
            <span className="text-xs text-slate-500 font-medium">ID do Pedido:</span>
            <span className="font-mono text-xs text-slate-800 font-bold">{createdOrder.id}</span>
          </div>

          <div className="flex justify-between items-center" id="detail-tracking">
            <span className="text-xs text-slate-500 font-medium">{t.track_code_label}</span>
            <span className="font-mono text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              {createdOrder.trackingCode}
            </span>
          </div>

          <div className="flex justify-between items-center" id="detail-total">
            <span className="text-xs text-slate-500 font-medium">Total Pago:</span>
            <span className="font-mono text-xs text-slate-800 font-bold">
              {formatCurrencyValue(createdOrder.total / exchangeRate, currency)}
            </span>
          </div>

          <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs" id="detail-eta">
            <span className="text-slate-500 font-medium">{t.delivery_est}:</span>
            <span className="font-semibold text-slate-700">
              {new Date(createdOrder.estimatedDelivery).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Destination Bank Account Confirmation */}
        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl text-left space-y-2.5 shadow-sm" id="merchant-account-confirmation">
          <div className="flex items-center gap-2 text-blue-800 font-bold text-xs" id="recipient-account-header">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Kivento - Pagamento Direto Recebido</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            Como administrador da <strong>Kivento Store</strong>, os fundos desta venda de <strong>{formatCurrencyValue(createdOrder.total, currency)}</strong> foram enviados diretamente para os seus dados de recebimento configurados:
          </p>
          <div className="bg-white border border-blue-100/50 p-2.5 rounded-xl space-y-1 text-[10px] font-mono text-slate-750" id="recipient-account-info">
            <div><strong>Banco:</strong> {settings.bankName}</div>
            <div><strong>Titular:</strong> {settings.accountHolder}</div>
            <div><strong>IBAN:</strong> {settings.iban}</div>
            {createdOrder.paymentMethod === 'mbway' && (
              <div><strong>MB Way:</strong> +351 {settings.mbwayPhone}</div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 pt-1 border-t border-blue-100/30" id="merchant-profit-stats">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Lucro Líquido Estimado:
            </span>
            <span className="font-mono text-emerald-600">
              {formatCurrencyValue(
                cart.reduce((acc, curr) => {
                  if (curr.product.isDropshipped && curr.product.originalPrice) {
                    return acc + (curr.product.price - curr.product.originalPrice) * curr.quantity;
                  }
                  return acc + (curr.product.price * 0.3) * curr.quantity;
                }, 0),
                currency
              )}
            </span>
          </div>
        </div>

        <button
          id="success-track-btn"
          onClick={() => onOrderSuccess(createdOrder.trackingCode)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
        >
          {language === 'pt' ? 'Ir para Rastreio em Tempo Real' : 'Go to Real-Time Tracking'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-3xl mx-auto shadow-sm relative animate-fade-in" id="checkout-modal">
      <button 
        onClick={onClose}
        className="absolute top-6 left-6 text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        id="checkout-back-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        {language === 'pt' ? 'Voltar ao Catálogo' : 'Back to Catalog'}
      </button>

      <div className="text-center space-y-2 pt-6 mb-8" id="checkout-title-header">
        <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
          {language === 'pt' ? 'Logística & Pagamento Europeu' : 'European Checkout & Logistics'}
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          {language === 'pt'
            ? 'Preencha os seus dados de entrega europeia e escolha um dos métodos de pagamento autorizados.'
            : 'Fill in your European delivery details and choose one of the authorized payment methods.'}
        </p>
      </div>

      {mbwayApproving ? (
        <div className="py-16 text-center space-y-6" id="mbway-approving-view">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <div className="space-y-2">
            <h4 className="text-base font-bold text-slate-900">Aguardando Autorização MB Way...</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {String(t.mbway_toast).replace('%s', formatCurrencyValue(convertedTotal / exchangeRate, currency))}
            </p>
          </div>
          <div className="w-44 bg-slate-100 border border-slate-200 mx-auto h-2 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 animate-pulse rounded-full" style={{ width: '70%' }} />
          </div>
        </div>
      ) : (
        <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8" id="checkout-form">
          {/* Customer Details Form */}
          <div className="space-y-4" id="checkout-details-section">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">
              {language === 'pt' ? 'Dados de Entrega' : 'Delivery Details'}
            </h3>

            <div className="space-y-3" id="details-inputs">
              <div className="space-y-1" id="field-name">
                <label className="text-[10px] text-slate-500 font-medium">Nome Completo:</label>
                <input
                  type="text"
                  required
                  id="customer-name-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Diana Silva"
                  className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 placeholder-slate-400 font-medium"
                />
              </div>

              <div className="space-y-1" id="field-email">
                <label className="text-[10px] text-slate-500 font-medium">E-mail:</label>
                <input
                  type="email"
                  required
                  id="customer-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="diana@example.eu"
                  className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 placeholder-slate-400 font-medium"
                />
              </div>

              <div className="space-y-1" id="field-phone">
                <label className="text-[10px] text-slate-500 font-medium">Contacto Telefónico:</label>
                <input
                  type="tel"
                  required
                  id="customer-phone-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+351 912 345 678"
                  className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 placeholder-slate-400 font-medium"
                />
              </div>

              <div className="space-y-1" id="field-address">
                <label className="text-[10px] text-slate-500 font-medium">Morada / Endereço:</label>
                <input
                  type="text"
                  required
                  id="customer-address-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Avenida da Liberdade 125, 4º Esq"
                  className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 placeholder-slate-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3" id="city-country-row">
                <div className="space-y-1" id="field-city">
                  <label className="text-[10px] text-slate-500 font-medium">Cidade / Localidade:</label>
                  <input
                    type="text"
                    required
                    id="customer-city-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Lisboa"
                    className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 placeholder-slate-400 font-medium"
                  />
                </div>

                <div className="space-y-1" id="field-country-code">
                  <label className="text-[10px] text-slate-500 font-medium">País Destino (Código):</label>
                  <input
                    type="text"
                    disabled
                    id="customer-country-code-display"
                    value={shippingDetails?.countryCode || ''}
                    className="w-full bg-slate-50 border border-slate-100 text-xs text-slate-600 rounded-lg p-2.5 outline-none cursor-not-allowed font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details Form */}
          <div className="space-y-5" id="checkout-payment-section">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">
              {t.payment_method}
            </h3>

            {/* Payment Method Switcher */}
            <div className="grid grid-cols-2 gap-3" id="payment-methods-switcher">
              <button
                type="button"
                id="select-mbway-btn"
                onClick={() => setPaymentMethod('mbway')}
                className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'mbway'
                    ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs font-bold">MB Way</span>
              </button>

              <button
                type="button"
                id="select-card-btn"
                onClick={() => setPaymentMethod('card')}
                className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-bold">International Card</span>
              </button>
            </div>

            {/* MB Way Fields */}
            {paymentMethod === 'mbway' ? (
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3" id="mbway-fields">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-medium">{t.mbway_number}:</label>
                  <div className="flex gap-2" id="mbway-phone-input-wrapper">
                    <span className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs font-mono flex items-center">
                      +351
                    </span>
                    <input
                      type="tel"
                      id="mbway-phone-input"
                      value={mbWayPhone}
                      onChange={(e) => setMbWayPhone(e.target.value)}
                      placeholder="912345678"
                      className="flex-1 bg-white text-xs text-slate-800 rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-600 placeholder-slate-400 font-mono font-medium"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  * MB Way é o serviço móvel mais popular em Portugal. Os fundos serão encaminhados diretamente para a conta bancária da Kivento Store (+351 {settings.mbwayPhone} - {settings.accountHolder}). Receberá um pedido de aprovação push na sua app de banco.
                </p>
              </div>
            ) : (
              // Card Fields
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3" id="card-fields">
                <div className="space-y-1" id="field-card-number">
                  <label className="text-[10px] text-slate-500 font-medium">{t.card_number}:</label>
                  <input
                    type="text"
                    id="card-number-input"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4000 1234 5678 9010"
                    className="w-full bg-white text-xs text-slate-800 rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-600 placeholder-slate-400 font-mono font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3" id="card-expiry-cvv-row">
                  <div className="space-y-1" id="field-card-expiry">
                    <label className="text-[10px] text-slate-500 font-medium">{t.card_expiry}:</label>
                    <input
                      type="text"
                      id="card-expiry-input"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      className="w-full bg-white text-xs text-slate-800 rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-600 placeholder-slate-400 font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1" id="field-card-cvv">
                    <label className="text-[10px] text-slate-500 font-medium">{t.card_cvv}:</label>
                    <input
                      type="text"
                      id="card-cvv-input"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                      className="w-full bg-white text-xs text-slate-800 rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-600 placeholder-slate-400 font-mono font-medium"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  * Aceitamos cartões Visa, Mastercard e American Express. Os pagamentos liquidados por este cartão serão depositados na conta Kivento Store no banco {settings.bankName} (IBAN: {settings.iban}, Titular: {settings.accountHolder}).
                </p>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl" id="checkout-error-banner">
                {errorMsg}
              </div>
            )}

            {/* Price details & checkout button */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs space-y-2.5" id="checkout-pricing-summary">
              <div className="flex justify-between text-slate-500" id="checkout-summary-subtotal">
                <span>{t.subtotal}:</span>
                <span className="font-mono">{formatCurrencyValue(cartSubtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-500" id="checkout-summary-shipping">
                <span>{t.shipping}:</span>
                <span className="font-mono">{formatCurrencyValue(shippingCost, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-2 text-sm" id="checkout-summary-total">
                <span>Total a Pagar:</span>
                <span className="font-mono text-blue-600 font-bold">
                  {formatCurrencyValue(cartSubtotal + shippingCost, currency)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              id="submit-payment-btn"
              disabled={loading}
              className={`w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                loading ? 'opacity-80 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A processar transação...</span>
                </>
              ) : (
                <span>{t.place_order}</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
