"use client";

import { useState } from "react";

type Payment = { weekEnding: string; amount: string };
const emptyPayment = (): Payment => ({ weekEnding: "", amount: "" });

export function Employee401kPaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([emptyPayment()]);
  const total = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const update = (index: number, key: keyof Payment, value: string) => setPayments(current => current.map((payment, rowIndex) => rowIndex === index ? { ...payment, [key]: value } : payment));
  return <div className="er-401k-payments-screen"><div className="er-401k-payments-toolbar"><b>IPG</b><button data-action-status="complete" onClick={() => setPayments([emptyPayment()])}>Delete Row</button></div><div className="er-401k-payments-grid-wrap"><table><thead><tr><th aria-label="Record selector"/><th>User Name</th><th>Timestamp</th><th>Week Ending</th><th>Payment</th><th /></tr></thead><tbody>{payments.map((payment,index)=><tr key={index}><td className="er-401k-row-star">*</td><td><input readOnly aria-label="User Name" /></td><td><input readOnly aria-label="Timestamp" /></td><td><input type="date" aria-label="Week Ending" value={payment.weekEnding} onChange={event=>update(index,"weekEnding",event.target.value)} /></td><td><input type="number" min="0" step="0.01" aria-label="Payment" value={payment.amount} onChange={event=>update(index,"amount",event.target.value)} /></td><td /></tr>)}<tr className="er-401k-total-row"><td/><td/><td/><td>Total</td><td>{total ? total.toLocaleString("en-US",{style:"currency",currency:"USD"}) : ""}</td><td/></tr>{Array.from({length:15},(_,index)=><tr className="er-401k-empty-row" key={`empty-${index}`}><td colSpan={6}/></tr>)}</tbody></table></div><div className="er-401k-payments-nav"><span>Record:</span><button data-action-status="missing" disabled>◀</button><button data-action-status="missing" disabled>◀</button><span>1 of 1</span><button data-action-status="missing" disabled>▶</button><button data-action-status="missing" disabled>▶</button><button data-action-status="missing" disabled>No Filter</button><label>Search<input aria-label="Search 401(k) payments"/></label></div></div>;
}
