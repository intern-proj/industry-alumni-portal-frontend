import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/aiService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export default function AiModelConfigurationManager() {
  const [activeConfig, setActiveConfig] = useState(null);
  const [availableConfigs, setAvailableConfigs] = useState([]);
  const [hardwareInfo, setHardwareInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inspectTarget, setInspectTarget] = useState(null);

  // Form edit state
  const [formData, setFormData] = useState({
    id: '',
    config_name: '',
    provider: 'LOCAL_GGUF',
    model_name: '',
    repo_id: '',
    filename: '',
    gpu_layers: 0,
    context_size: 4096,
    threads: 4,
    temperature: 0.2,
    azure_endpoint: '',
    azure_api_key: '',
    azure_deployment_name: '',
    is_active: false,
    is_password_set: false,
  });

  // Inference Benchmark Test State
  const [testPrompt, setTestPrompt] = useState('Verify model identity, parameter size, and system readiness.');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await aiService.getModelConfigs();
      const data = res.data;
      if (data) {
        setActiveConfig(data.active_config);
        setAvailableConfigs(data.available_configs || []);
        setHardwareInfo(data.hardware_info || {});
      }
    } catch (err) {
      console.warn('Failed to load model configurations:', err);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (cfg) => {
    setFormData({
      id: cfg?.id || '',
      config_name: cfg?.config_name || '',
      provider: cfg?.provider || 'LOCAL_GGUF',
      model_name: cfg?.model_name || '',
      repo_id: cfg?.repo_id || '',
      filename: cfg?.filename || '',
      gpu_layers: cfg?.gpu_layers !== undefined ? cfg.gpu_layers : 0,
      context_size: cfg?.context_size || 4096,
      threads: cfg?.threads || 4,
      temperature: cfg?.temperature || 0.2,
      azure_endpoint: cfg?.azure_endpoint || '',
      azure_api_key: '',
      is_password_set: !!cfg?.is_password_set,
      azure_deployment_name: cfg?.azure_deployment_name || '',
      is_active: !!cfg?.is_active,
    });
  };

  const handleOpenInspectModal = (config) => {
    setInspectTarget(config);
    populateForm(config);
    setIsModalOpen(true);
  };

  const handleOpenNewConfigModal = () => {
    setInspectTarget(null);
    populateForm({
      id: '',
      config_name: 'Custom Azure Model Setup',
      provider: 'LOCAL_GGUF',
      model_name: '',
      repo_id: '',
      filename: '',
      gpu_layers: -1,
      context_size: 8192,
      threads: 8,
      temperature: 0.2,
      azure_endpoint: '',
      azure_api_key: '',
      azure_deployment_name: '',
      is_active: false,
    });
    setIsModalOpen(true);
  };

  const handleActivateModel = async (config) => {
    setActivatingId(config.id);
    setStatusMsg({ type: '', text: '' });
    try {
      const payload = {
        ...config,
        is_active: true,
      };
      await aiService.updateModelConfig(payload);
      setStatusMsg({
        type: 'success',
        text: `Switched active AI model to "${config.model_name}". The LLM engine has reloaded with the new configuration.`,
      });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 6000);
      await fetchConfigs();
    } catch (err) {
      console.error('Failed to activate model:', err);
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to activate the selected model.',
      });
    } finally {
      setActivatingId(null);
    }
  };

  const handleSaveModal = async (shouldActivate = false) => {
    if (!formData.config_name || !formData.model_name) {
      setStatusMsg({ type: 'error', text: 'Configuration Name and Model Name are required.' });
      return;
    }

    setSaving(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const payload = {
        ...formData,
        gpu_layers: Number(formData.gpu_layers),
        context_size: Number(formData.context_size),
        threads: Number(formData.threads),
        temperature: Number(formData.temperature),
        is_active: shouldActivate ? true : formData.is_active,
      };

      await aiService.updateModelConfig(payload);

      setStatusMsg({
        type: 'success',
        text: shouldActivate
          ? `Model "${formData.model_name}" parameters saved and activated as the live LLM engine.`
          : `Model "${formData.model_name}" parameters successfully updated in database.`,
      });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 6000);
      await fetchConfigs();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save model configuration:', err);
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to save configuration.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRunInferenceTest = async (e) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    try {
      const res = await aiService.testModelInference(testPrompt);
      const data = res.data;
      setTestResult({
        success: data.success,
        model_name: data.model_name,
        latency_ms: data.latency_ms,
        response: data.response || data.error,
        gpu_accelerated: data.gpu_accelerated,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      console.error('Inference test error:', err);
      setTestResult({
        success: false,
        model_name: activeConfig?.model_name || 'Active Model',
        latency_ms: null,
        response: err.response?.data?.error || err.message || 'Inference test failed.',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI Models & GPU Infrastructure
            </h1>
            <Badge variant="emerald" className="font-semibold text-[11px]">
              Azure Ready
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage active LLM architectures, switch between baseline system models and Azure CUDA GPU models, or configure Azure OpenAI endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon="refresh"
            onClick={fetchConfigs}
            loading={loading}
          >
            Refresh Models
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="add"
            onClick={handleOpenNewConfigModal}
          >
            Add Custom Configuration
          </Button>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMsg.text && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-start gap-3 shadow-xs animate-in fade-in duration-200 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
            {statusMsg.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <div className="flex-1">{statusMsg.text}</div>
          <button onClick={() => setStatusMsg({ type: '', text: '' })} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Active Model Spotlight Card */}
      {activeConfig && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/30 border border-emerald-400/40 text-emerald-200">
                  Currently Active Engine
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white">
                  {activeConfig.provider}
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[28px]">psychology</span>
                {activeConfig.model_name}
              </h2>
              <p className="text-xs text-slate-300 font-mono">
                {activeConfig.repo_id ? `${activeConfig.repo_id} / ${activeConfig.filename}` : (activeConfig.azure_deployment_name || 'Custom Cloud Deployment')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-white/5 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/10 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">GPU Offload</p>
                <p className="font-extrabold text-white mt-0.5">
                  {activeConfig.gpu_layers === -1 ? 'All Layers (CUDA)' : (activeConfig.gpu_layers > 0 ? `${activeConfig.gpu_layers} Layers` : 'CPU (0 Layers)')}
                </p>
              </div>
              <div className="w-px h-7 bg-white/10" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Context Window</p>
                <p className="font-extrabold text-white mt-0.5">{activeConfig.context_size?.toLocaleString()} tokens</p>
              </div>
              <div className="w-px h-7 bg-white/10" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Threads / Temp</p>
                <p className="font-extrabold text-white mt-0.5">{activeConfig.threads}T • {activeConfig.temperature} temp</p>
              </div>
              <div className="w-px h-7 bg-white/10" />
              <button
                type="button"
                onClick={() => handleOpenInspectModal(activeConfig)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-emerald-950 shadow-md shadow-emerald-950/40 hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                Inspect / Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available Configurations Section (Baseline Present + Azure GPU Presets) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">tune</span>
                <CardTitle>Available AI Model Configurations</CardTitle>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose from the existing baseline system setup or switch to high-performance Azure GPU & Cloud models with 1 click.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableConfigs.map((cfg) => {
              const isCurrent = cfg.id === activeConfig?.id || (activeConfig?.model_name === cfg.model_name && activeConfig?.gpu_layers === cfg.gpu_layers);
              const isGpu = cfg.gpu_layers === -1 || cfg.gpu_layers > 0;
              const isDefaultSetup = cfg.id === 'default-qwen4b-cpu' || cfg.config_name.includes('Current System Setup');

              return (
                <div
                  key={cfg.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant={isCurrent ? 'success' : 'outline'}
                          className="text-[10px] font-bold"
                        >
                          {isCurrent ? 'Active Engine' : 'Available'}
                        </Badge>
                        {isDefaultSetup && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            Baseline Default
                          </span>
                        )}
                        {isGpu && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]">speed</span> GPU CUDA
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{cfg.provider}</span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {cfg.config_name}
                      </h3>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {cfg.model_name}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span>GPU Layers:</span>
                        <span className="font-bold">{cfg.gpu_layers === -1 ? 'Full (All Layers)' : (cfg.gpu_layers > 0 ? cfg.gpu_layers : '0 (CPU)')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Context:</span>
                        <span className="font-bold">{cfg.context_size?.toLocaleString()} tokens</span>
                      </div>
                      {cfg.filename && (
                        <div className="truncate" title={cfg.filename}>
                          <span className="text-slate-400">File:</span> {cfg.filename}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenInspectModal(cfg)}
                      className="text-xs font-semibold"
                      icon="tune"
                    >
                      Inspect / Edit
                    </Button>

                    {!isCurrent ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleActivateModel(cfg)}
                        loading={activatingId === cfg.id}
                        className="text-xs font-bold"
                        icon="check"
                      >
                        Activate Model
                      </Button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">verified</span> Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section: Live Inference Benchmark */}
      <div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">speed</span>
              <CardTitle>Inference Diagnostic & Latency Benchmark</CardTitle>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Benchmark the active model ({activeConfig?.model_name || 'System LLM'}) to measure token generation speed, warm status, and response latency.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleRunInferenceTest} className="space-y-3">
              <Input
                label="Diagnostic Test Prompt"
                placeholder="Ask the active model a test query..."
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
              />

              <Button
                type="submit"
                loading={testing}
                variant="outline"
                icon="play_arrow"
                className="w-full justify-center text-xs font-bold border-emerald-300 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                {testing ? 'Executing Inference...' : 'Run Benchmark Prompt'}
              </Button>
            </form>

            {/* Benchmark Output Box */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-2 animate-in fade-in duration-200 ${
                  testResult.success
                    ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">
                      {testResult.success ? 'check_circle' : 'error'}
                    </span>
                    <span>{testResult.model_name}</span>
                  </span>
                  {testResult.latency_ms && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      {testResult.latency_ms} ms
                    </span>
                  )}
                </div>

                <p className="font-mono text-[11px] leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                  {testResult.response}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dedicated Inspect & Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={inspectTarget ? `Inspect & Edit: ${formData.model_name || formData.config_name}` : 'Create Custom AI Model Configuration'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Top Status & Architecture Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-[24px]">memory</span>
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white">
                  {formData.model_name || 'New Model Architecture'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Provider: {formData.provider}
                </p>
              </div>
            </div>
            <div>
              {formData.is_active ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">verified</span> Active Engine
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Inactive Option
                </span>
              )}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveModal(false);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8">
                <Input
                  label="Configuration Label / Display Name"
                  placeholder="e.g. Azure GPU Qwen 2.5 7B CUDA"
                  value={formData.config_name}
                  onChange={(e) => setFormData({ ...formData, config_name: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-4">
                <Select
                  label="Provider Engine"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                >
                  <option value="LOCAL_GGUF">Local GGUF (CUDA / CPU)</option>
                  <option value="AZURE_OPENAI">Azure OpenAI Service</option>
                  <option value="OPENAI_COMPATIBLE">vLLM / Ollama Cluster</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <Input
                  label="Model Name"
                  placeholder="e.g. Qwen 2.5 7B Instruct"
                  value={formData.model_name}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-6">
                <Input
                  label="HuggingFace Repo ID (for Local GGUF)"
                  placeholder="e.g. Qwen/Qwen2.5-7B-Instruct-GGUF"
                  value={formData.repo_id}
                  onChange={(e) => setFormData({ ...formData, repo_id: e.target.value })}
                />
              </div>
            </div>

            {formData.provider === 'LOCAL_GGUF' && (
              <div>
                <Input
                  label="GGUF Filename"
                  placeholder="e.g. qwen2.5-7b-instruct-q4_k_m.gguf"
                  value={formData.filename}
                  onChange={(e) => setFormData({ ...formData, filename: e.target.value })}
                />
              </div>
            )}

            {/* Azure OpenAI Settings */}
            {formData.provider !== 'LOCAL_GGUF' && (
              <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 space-y-3">
                <h4 className="font-bold text-xs text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">cloud</span>
                  Azure Endpoint & Credentials
                </h4>
                <div className="space-y-3">
                  <Input
                    label="Endpoint URL"
                    placeholder="https://your-resource.openai.azure.com/ or https://vllm.internal.net/v1"
                    value={formData.azure_endpoint}
                    onChange={(e) => setFormData({ ...formData, azure_endpoint: e.target.value })}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Deployment Name / Model Identifier"
                      placeholder="e.g. gpt-4o-mini"
                      value={formData.azure_deployment_name}
                      onChange={(e) => setFormData({ ...formData, azure_deployment_name: e.target.value })}
                    />
                    <Input
                      label="API Key / Secret"
                      type="password"
                      placeholder={formData.is_password_set ? 'Leave blank to preserve saved key' : 'Enter API Key'}
                      value={formData.azure_api_key}
                      onChange={(e) => setFormData({ ...formData, azure_api_key: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* GPU & Hardware Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    GPU Offload Layers
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gpu_layers: 0 })}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        Number(formData.gpu_layers) === 0
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      CPU (0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gpu_layers: -1 })}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        Number(formData.gpu_layers) === -1
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Full GPU (-1)
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  placeholder="0 for CPU, -1 for full GPU"
                  value={formData.gpu_layers}
                  onChange={(e) => setFormData({ ...formData, gpu_layers: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Context Window Size
                </label>
                <select
                  value={formData.context_size}
                  onChange={(e) => setFormData({ ...formData, context_size: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value={2048}>2,048 tokens</option>
                  <option value={4096}>4,096 tokens (Default)</option>
                  <option value={8192}>8,192 tokens (GPU Standard)</option>
                  <option value={16384}>16,384 tokens (Deep Documents)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  CPU Threads
                </label>
                <input
                  type="number"
                  value={formData.threads}
                  onChange={(e) => setFormData({ ...formData, threads: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  variant="outline"
                  loading={saving}
                  icon="save"
                  className="text-xs"
                >
                  Save Parameters
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  loading={saving}
                  onClick={() => handleSaveModal(true)}
                  icon="bolt"
                  className="text-xs font-bold"
                >
                  Save & Activate Now
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
