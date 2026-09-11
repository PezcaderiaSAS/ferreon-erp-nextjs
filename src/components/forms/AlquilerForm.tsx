"use client";

import React, { useEffect } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ClienteForm } from './ClienteForm';
import { BodegaForm } from './BodegaForm';
import { useAlquilerForm } from './alquiler/useAlquilerForm';
import { AlquilerStepper } from './alquiler/AlquilerStepper';
import { StepClienteGarantias } from './alquiler/StepClienteGarantias';
import { StepEquiposLogistica } from './alquiler/StepEquiposLogistica';
import { StepResumenLiquidacion } from './alquiler/StepResumenLiquidacion';
import { AlquilerPreviewModal } from './alquiler/AlquilerPreviewModal';
import { AlquilerSuccessView } from './alquiler/AlquilerSuccessView';
import { AlquilerFormProps } from './alquiler/types';

export function AlquilerForm({ initialData, onSuccess, onCancel, onDirtyChange }: AlquilerFormProps) {
  const form = useAlquilerForm({ initialData, onSuccess, onCancel, onDirtyChange });

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (form.currentStep === 2) {
          form.addItemRow();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [form]);

  if (form.isSuccess && form.savedAlquilerData) {
    return (
      <AlquilerSuccessView
        isEditMode={form.isEditMode}
        savedAlquilerData={form.savedAlquilerData}
        onPrint={form.handleAbrirImpresionHTML}
        onContinue={() => onSuccess(form.savedAlquilerData)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AlquilerStepper currentStep={form.currentStep} onStepClick={form.setCurrentStep} />

      <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">
        {/* PASO 1: CLIENTE Y GARANTÍAS */}
        {form.currentStep === 1 && (
          <StepClienteGarantias
            isEditMode={form.isEditMode}
            tipoDocumento={form.tipoDocumento}
            setTipoDocumento={form.setTipoDocumento}
            estadoDocumento={form.estadoDocumento}
            setEstadoDocumento={form.setEstadoDocumento}
            cotizacionOrigen={form.cotizacionOrigen}
            clienteId={form.clienteId}
            setClienteId={form.setClienteId}
            selectedCliente={form.selectedCliente}
            displayClienteNombre={form.displayClienteNombre}
            displayClienteNit={form.displayClienteNit}
            displayClienteTelefono={form.displayClienteTelefono}
            clientSearchTerm={form.clientSearchTerm}
            setClientSearchTerm={form.setClientSearchTerm}
            isClientDropdownOpen={form.isClientDropdownOpen}
            setIsClientDropdownOpen={form.setIsClientDropdownOpen}
            filteredClientes={form.filteredClientes}
            isLoadingCatalogs={form.isLoadingCatalogs}
            setIsCreandoCliente={form.setIsCreandoCliente}
            fechaRegistro={form.fechaRegistro}
            setFechaRegistro={form.setFechaRegistro}
            fechaInicioContrato={form.fechaInicioContrato}
            fechaFinEstimadaContrato={form.fechaFinEstimadaContrato}
            handleFechaInicioMasterChange={form.handleFechaInicioMasterChange}
            handleFechaFinMasterChange={form.handleFechaFinMasterChange}
            esFechaInicioEnPasado={form.esFechaInicioEnPasado}
            ratificarFechaInicioAHoy={form.ratificarFechaInicioAHoy}
            garantiaTipo={form.garantiaTipo}
            setGarantiaTipo={form.setGarantiaTipo}
            garantiaMonto={form.garantiaMonto}
            setGarantiaMonto={form.setGarantiaMonto}
            deposito={form.deposito}
            setDeposito={form.setDeposito}
            depositoExoneradoCredito={form.depositoExoneradoCredito}
            setDepositoExoneradoCredito={form.setDepositoExoneradoCredito}
            estadoCarteraCliente={form.estadoCarteraCliente}
            desbloqueoSupervisorAprobado={form.desbloqueoSupervisorAprobado}
            mostrarModalDesbloqueo={form.mostrarModalDesbloqueo}
            setMostrarModalDesbloqueo={form.setMostrarModalDesbloqueo}
            pinSupervisorIngresado={form.pinSupervisorIngresado}
            setPinSupervisorIngresado={form.setPinSupervisorIngresado}
            errorPinSupervisor={form.errorPinSupervisor}
            autorizarDesbloqueoSupervisor={form.autorizarDesbloqueoSupervisor}
            revocarDesbloqueoSupervisor={form.revocarDesbloqueoSupervisor}
            formErrors={form.formErrors}
          />
        )}

        {/* PASO 2: EQUIPOS Y LOGÍSTICA */}
        {form.currentStep === 2 && (
          <StepEquiposLogistica
            items={form.items}
            setItems={form.setItems}
            equiposActivos={form.equiposActivos}
            tipoDocumento={form.tipoDocumento}
            addItemRow={form.addItemRow}
            removeItemRow={form.removeItemRow}
            updateItemRow={form.updateItemRow}
            verificarStockItem={form.verificarStockItem}
            toggleSubcontratacionItem={form.toggleSubcontratacionItem}
            updateSubcontratoItem={form.updateSubcontratoItem}
            costoTotalSubcontratacion={form.costoTotalSubcontratacion}
            margenTotalSubcontratacion={form.margenTotalSubcontratacion}
            totalItemsSubcontratados={form.totalItemsSubcontratados}
            autoFocusRowId={form.autoFocusRowId}
            openComboboxRowId={form.openComboboxRowId}
            setOpenComboboxRowId={form.setOpenComboboxRowId}
            setIsCreandoEquipo={form.setIsCreandoEquipo}
            fleteEntrega={form.fleteEntrega}
            setFleteEntrega={form.setFleteEntrega}
            fleteRecogida={form.fleteRecogida}
            setFleteRecogida={form.setFleteRecogida}
            formatearCOP={form.formatearCOP}
            formErrors={form.formErrors}
          />
        )}

        {/* PASO 3: RESUMEN Y LIQUIDACIÓN */}
        {form.currentStep === 3 && (
          <StepResumenLiquidacion
            observaciones={form.observaciones}
            setObservaciones={form.setObservaciones}
            detallesLogistica={form.detallesLogistica}
            setDetallesLogistica={form.setDetallesLogistica}
            subtotalEquipos={form.subtotalEquipos}
            totalFletes={form.totalFletes}
            deposito={form.deposito}
            totalEstimado={form.totalEstimado}
            garantiaTipo={form.garantiaTipo}
            garantiaMonto={form.garantiaMonto}
            valorReposicionTotal={form.valorReposicionTotal}
            formatearCOP={form.formatearCOP}
            aplicaImpuesto={form.aplicaImpuesto}
            toggleAplicaImpuesto={form.toggleAplicaImpuesto}
            tasaImpuesto={form.tasaImpuesto}
            setTasaImpuesto={form.setTasaImpuesto}
            valorImpuesto={form.valorImpuesto}
            nombreImpuesto={form.nombreImpuesto}
            tipoDocumento={form.tipoDocumento}
            setTipoDocumento={form.setTipoDocumento}
            guardarComoCotizacion={form.guardarComoCotizacion}
            formalizarComoContrato={form.formalizarComoContrato}
            isSubmitting={form.isSubmitting}
            costoTotalSubcontratacion={form.costoTotalSubcontratacion}
            margenTotalSubcontratacion={form.margenTotalSubcontratacion}
            totalItemsSubcontratados={form.totalItemsSubcontratados}
            depositoExoneradoCredito={form.depositoExoneradoCredito}
            onOpenPreview={() => form.setIsPreviewModalOpen(true)}
          />
        )}

        {/* Barra de Acciones Inferior Sticky */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-4 bg-white/95 backdrop-blur-md border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 z-20 mt-6 rounded-b-2xl sm:rounded-b-3xl">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center space-x-2">
            {form.currentStep > 1 && (
              <button
                type="button"
                onClick={form.handlePrevStep}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
              >
                ← Anterior
              </button>
            )}

            {form.currentStep < 3 ? (
              <button
                type="button"
                onClick={form.handleNextStep}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer active:scale-98"
              >
                <span>Continuar</span>
                <span>→</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => form.setIsPreviewModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>👁️</span>
                  <span>Vista Previa</span>
                </button>

                {form.tipoDocumento === 'COTIZACION' ? (
                  <Button 
                    type="button"
                    onClick={() => form.guardarComoCotizacion()}
                    isLoading={form.isSubmitting}
                    className="px-6 py-2.5 min-w-[170px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 font-bold text-xs sm:text-sm rounded-xl flex items-center space-x-2 cursor-pointer active:scale-98"
                  >
                    <span>📄</span>
                    <span>{form.isEditMode ? "Guardar Cotización" : "Guardar Cotización (COT)"}</span>
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    onClick={() => form.formalizarComoContrato()}
                    isLoading={form.isSubmitting}
                    className="px-6 py-2.5 min-w-[170px] bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg shadow-emerald-700/25 font-bold text-xs sm:text-sm rounded-xl flex items-center space-x-2 cursor-pointer active:scale-98"
                  >
                    <span>✅</span>
                    <span>{form.isEditMode ? "Guardar Contrato" : "Formalizar Contrato (ALQ)"}</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Modal de Vista Previa Oficial */}
      <AlquilerPreviewModal
        isOpen={form.isPreviewModalOpen}
        onClose={() => form.setIsPreviewModalOpen(false)}
        tipoDocumento={form.tipoDocumento}
        consecutivo={form.savedAlquilerData?.consecutivo || (form.tipoDocumento === 'COTIZACION' ? 'COT-BORRADOR' : 'ALQ-BORRADOR')}
        previewPaperSize={form.previewPaperSize}
        setPreviewPaperSize={form.setPreviewPaperSize}
        onPrint={form.handleAbrirImpresionHTML}
        fechaRegistro={form.fechaRegistro}
        selectedCliente={form.selectedCliente}
        detallesLogistica={form.detallesLogistica}
        garantiaTipo={form.garantiaTipo}
        garantiaMonto={form.garantiaMonto}
        observaciones={form.observaciones}
        items={form.items}
        equiposActivos={form.equiposActivos}
        subtotalEquipos={form.subtotalEquipos}
        totalFletes={form.totalFletes}
        deposito={form.deposito}
        depositoExoneradoCredito={form.depositoExoneradoCredito}
        totalEstimado={form.totalEstimado}
        aplicaImpuesto={form.aplicaImpuesto}
        tasaImpuesto={form.tasaImpuesto}
        valorImpuesto={form.valorImpuesto}
        nombreImpuesto={form.nombreImpuesto}
        costoTotalSubcontratacion={form.costoTotalSubcontratacion}
        margenTotalSubcontratacion={form.margenTotalSubcontratacion}
        formatearCOP={form.formatearCOP}
      />

      {/* Submodales de creación rápida On-The-Fly */}
      <Modal 
        isOpen={form.isCreandoCliente} 
        onClose={() => form.setIsCreandoCliente(false)} 
        title="Crear Cliente" 
        maxWidth="2xl"
      >
        <ClienteForm 
          onSuccess={(nuevoCliente) => {
            if (nuevoCliente && nuevoCliente.id) {
              form.setClienteId(String(nuevoCliente.id));
              form.setClientSearchTerm('');
            }
            form.setIsCreandoCliente(false);
            form.fetchCatalogsBackground();
          }} 
          onCancel={() => form.setIsCreandoCliente(false)} 
        />
      </Modal>

      <Modal 
        isOpen={form.isCreandoEquipo} 
        onClose={() => form.setIsCreandoEquipo(false)} 
        title="Crear Equipo" 
        maxWidth="2xl"
      >
        <BodegaForm 
          onSuccess={(nuevoEquipo) => {
            if (nuevoEquipo && nuevoEquipo.id) {
              const newItems = [...form.items];
              if (newItems.length > 0 && !newItems[newItems.length - 1].itemId) {
                newItems[newItems.length - 1] = { 
                  ...newItems[newItems.length - 1], 
                  itemId: String(nuevoEquipo.id), 
                  precioDiario: nuevoEquipo.tarifaDiaria || 0 
                };
              } else {
                newItems.push({ 
                  id: Date.now().toString(), 
                  itemId: String(nuevoEquipo.id), 
                  cantidad: 1, 
                  precioDiario: nuevoEquipo.tarifaDiaria || 0, 
                  fechaInicio: form.fechaInicioContrato, 
                  fechaFinEstimada: form.fechaFinEstimadaContrato 
                });
              }
              form.setItems(newItems);
            }
            form.setIsCreandoEquipo(false);
            form.fetchCatalogsBackground();
          }} 
          onCancel={() => form.setIsCreandoEquipo(false)} 
        />
      </Modal>
    </div>
  );
}
