'use client';
// Generado desde Tarjeta Producto.dc.html con tools/convert-dc.mjs y luego ajustado a mano.
import React, { Fragment } from 'react';
import { DCLogic, arr } from '@/lib/dc';
import ImageSlot from '@/components/ImageSlot';

export default class TarjetaProducto extends DCLogic {
  state = { h: false };
  renderVals() {
    const p = this.props.p || { id: 'vista-previa', marca: '[MARCA]', nombre: '[NOMBRE DEL PERFUME]', meta: '[CONCENTRACIÓN] · [ML] ml · [GÉNERO]', precioTxt: 'L [PRECIO]', tagLabel: 'Disponible', tagBg: '#F5E6E0', tagColor: '#3D0000', tagBorder: '#E2CBC1', agotado: false };
    const h = this.state.h;
    return {
      p,
      enter: () => this.setState({ h: true }),
      leave: () => this.setState({ h: false }),
      op2: h ? 1 : 0,
      pe2: h ? 'auto' : 'none',
      filt: p.agotado ? 'grayscale(1)' : 'none',
      available: !p.agotado,
      soldOut: !!p.agotado
    };
  }

  render() { return view({ ...this.props, ...this.renderVals() }); }
}

function view($v) {
  return (
  <>
    <article onMouseEnter={$v.enter} onMouseLeave={$v.leave} style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%", background: "#FBF4F0", fontFamily: "Jost, sans-serif", color: "#3D0000" }}>
      <div style={{ position: "relative", aspectRatio: "4 / 5", background: "#F5E6E0", overflow: "hidden", color: "#6E3A34" }}>
        <div style={{ position: "absolute", inset: "0", filter: $v.filt }}>
          <ImageSlot id={`foto-${$v.p?.id ?? ""}-1`} shape={"rect"} placeholder={`[FOTO 1] ${$v.p?.nombre ?? ""}`} />
        </div>
        <div style={{ position: "absolute", inset: "0", opacity: $v.op2, pointerEvents: $v.pe2, transition: "opacity .45s ease", background: "#F5E6E0", filter: $v.filt }}>
          <ImageSlot id={`foto-${$v.p?.id ?? ""}-2`} shape={"rect"} placeholder={"[FOTO 2] Caja o detalle"} />
        </div>
        <span style={{ position: "absolute", top: "12px", left: "12px", padding: "6px 10px", fontSize: "10px", letterSpacing: ".18em", textTransform: "uppercase", lineHeight: "1", background: $v.p?.tagBg, color: $v.p?.tagColor, border: `1px solid ${$v.p?.tagBorder ?? ""}`, pointerEvents: "none" }}>
          {$v.p?.tagLabel}
        </span>
        {" "}
        {$v.p?.hasDescuento ? (
          <>
            <span style={{ position: "absolute", top: "12px", right: "12px", padding: "6px 9px", fontSize: "11px", fontWeight: "500", letterSpacing: ".06em", lineHeight: "1", background: "#3D0000", color: "#F5E6E0", borderRadius: "999px", pointerEvents: "none" }}>
              {$v.p?.descTxt}
            </span>
          </>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1" }}>
        <span style={{ fontSize: "10.5px", letterSpacing: ".24em", textTransform: "uppercase", color: "#7A532E" }}>
          {$v.p?.marca}
        </span>
        {" "}
        <button onClick={$v.p?.onOpen} style={{ all: "unset", cursor: "pointer", fontFamily: "'Cormorant Garamond', serif", fontWeight: "400", fontSize: "clamp(20px,1.7vw,24px)", lineHeight: "1.15", color: "#3D0000", textWrap: "pretty" }} className={"dcp2"}>
          {$v.p?.nombre}
        </button>
        {" "}
        <span style={{ fontSize: "12px", letterSpacing: ".04em", color: "#6E3A34" }}>
          {$v.p?.meta}
        </span>
        {" "}
        {$v.p?.hasRating ? (
          <>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6E3A34" }}>
              <span style={{ color: "#A97C50", letterSpacing: ".08em", fontSize: "13px" }}>
                {$v.p?.stars}
              </span>
              {$v.p?.ratingCount}
            </span>
          </>
        ) : null}
        {" "}
        <span style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 10px", marginTop: "4px" }}>
          <span style={{ fontSize: "15px", fontWeight: "500", letterSpacing: ".03em", color: "#3D0000" }}>
            {$v.p?.precioTxt}
          </span>
          {" "}
          {$v.p?.hasDescuento ? (
            <>
              <span style={{ fontSize: "13px", color: "#6E3A34", textDecoration: "line-through" }}>
                {$v.p?.precioAntes}
              </span>
            </>
          ) : null}
        </span>
      </div>
      {$v.available ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button onClick={$v.p?.onAdd} style={{ minHeight: "44px", borderRadius: "999px", border: "1px solid #3D0000", background: "#3D0000", color: "#F5E6E0", fontFamily: "Jost, sans-serif", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", whiteSpace: "nowrap", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "0 10px" }} className={"dcp4"}>
              <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.3"} strokeLinejoin={"round"}><path d={"M5.5 8h13l-1 12.5h-11L5.5 8z"} /><path d={"M9 10V6.5a3 3 0 0 1 6 0V10"} /></svg>
              {"Agregar al carrito"}
            </button>
          </div>
        </>
      ) : null}
      {" "}
      {$v.soldOut ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "stretch" }}>
            <button disabled={true} style={{ minHeight: "44px", borderRadius: "999px", border: "1px solid #E2CBC1", background: "#F5E6E0", color: "#6E3A34", fontFamily: "Jost, sans-serif", fontSize: "13px", letterSpacing: ".03em", cursor: "not-allowed", padding: "0 14px" }}>
              {"Agotado"}
            </button>
            {" "}
            <button onClick={$v.p?.onNotify} style={{ minHeight: "44px", background: "none", border: "none", color: "#3D0000", fontFamily: "Jost, sans-serif", fontSize: "13px", cursor: "pointer", textDecoration: "underline", textDecorationColor: "#A97C50", textUnderlineOffset: "5px" }} className={"dcp2"}>
              {"Avisarme cuando llegue"}
            </button>
          </div>
        </>
      ) : null}
    </article>
  </>
  );
}
