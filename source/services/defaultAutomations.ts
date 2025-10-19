import { nanoid } from 'nanoid';
import { Automation } from '../types/automation.js';

export const getDefaultAutomations = (): Automation[] => {
  const now = new Date().toISOString();

  return [
    // AUTOMAÇÃO 1: Monitor de Preços com Análise de Mercado
    {
      id: nanoid(),
      name: 'Monitor de Preços e Análise de Mercado',
      description:
        'Monitora preços de produtos, analisa tendências de mercado usando agentes especializados, gera relatório PDF e envia por email',
      enabled: true,
      version: '2.0.0',
      edges: [],
      createdAt: now,
      updatedAt: now,
      runCount: 0,
      startNodeId: 'trigger-1',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          name: 'Trigger Manual',
          config: {
            type: 'manual',
            data: {
              products: [
                { name: 'iPhone 15 Pro', url: 'https://api.example.com/products/1' },
                { name: 'Samsung Galaxy S24', url: 'https://api.example.com/products/2' },
                { name: 'Google Pixel 8', url: 'https://api.example.com/products/3' },
              ],
            },
          },
          nextNodes: ['http-1'],
        },
        {
          id: 'http-1',
          type: 'http_request',
          name: 'Buscar Preços',
          config: {
            url: 'https://api.example.com/prices',
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
          nextNodes: ['agent-1'],
        },
        {
          id: 'agent-1',
          type: 'agent',
          name: 'Análise de Dados (DataAnalyst)',
          config: {
            agentId: 'data-analyst',
            prompt: `Analise os dados de preços dos produtos. Para cada produto:
1. Calcule a variação de preço (%)
2. Identifique tendências (alta, baixa, estável)
3. Compare com média histórica
4. Gere insights sobre o melhor momento de compra
5. Identifique anomalias ou promoções`,
            inputFrom: 'http-1',
          },
          nextNodes: ['agent-2'],
        },
        {
          id: 'agent-2',
          type: 'agent',
          name: 'Análise de Mercado (MarketAnalyst)',
          config: {
            agentId: 'market-analyst',
            prompt: `Com base nos dados de preços e tendências, faça uma análise completa de mercado:
1. Compare preços entre concorrentes
2. Analise estratégias de precificação
3. Identifique oportunidades de arbitragem
4. Preveja tendências futuras
5. Gere recomendações estratégicas`,
            inputFrom: 'agent-1',
          },
          nextNodes: ['transform-1'],
        },
        {
          id: 'transform-1',
          type: 'data_transform',
          name: 'Formatar Relatório',
          config: {
            inputFrom: 'agent-2',
            transform: `{
              title: 'Relatório de Análise de Preços e Mercado',
              date: new Date().toISOString(),
              analysis: data.response,
              products: data.products,
              recommendations: data.recommendations
            }`,
          },
          nextNodes: ['file-1'],
        },
        {
          id: 'file-1',
          type: 'file_operation',
          name: 'Gerar Relatório PDF',
          config: {
            operation: 'write',
            filename: 'relatorio-precos.json',
            content: '{{transform-1.output}}',
          },
          nextNodes: ['mcp-1'],
        },
        {
          id: 'mcp-1',
          type: 'mcp_tool',
          name: 'Converter para PDF',
          config: {
            mcpId: 'document-mcp',
            toolId: 'convertToPDF',
            params: {
              input: 'relatorio-precos.json',
              output: 'relatorio-precos.pdf',
            },
          },
          nextNodes: ['agent-3'],
        },
        {
          id: 'agent-3',
          type: 'agent',
          name: 'Gerar Email (CommunicationAgent)',
          config: {
            agentId: 'communication-agent',
            prompt: `Crie um email profissional e atraente para enviar o relatório de análise de preços.
Inclua:
1. Assunto chamativo
2. Resumo executivo dos principais insights
3. Chamada para ação
4. Texto em HTML formatado`,
            inputFrom: 'transform-1',
          },
          nextNodes: ['mcp-2'],
        },
        {
          id: 'mcp-2',
          type: 'mcp_tool',
          name: 'Enviar Email em Massa',
          config: {
            mcpId: 'email-mcp',
            toolId: 'sendBulkEmail',
            params: {
              to: ['cliente1@example.com', 'cliente2@example.com', 'cliente3@example.com'],
              subject: '{{agent-3.response.subject}}',
              body: '{{agent-3.response.body}}',
              attachments: ['relatorio-precos.pdf'],
            },
          },
          nextNodes: [],
        },
      ],
    },

    // AUTOMAÇÃO 2: Criação de Conteúdo Multimídia Completo
    {
      id: nanoid(),
      name: 'Criação de Conteúdo Multimídia com IA',
      description:
        'Cria conteúdo completo: pesquisa, redação, geração de imagens, conversão para áudio, legendas e publicação automática',
      enabled: true,
      version: '2.0.0',
      edges: [],
      createdAt: now,
      updatedAt: now,
      runCount: 0,
      startNodeId: 'trigger-2',
      nodes: [
        {
          id: 'trigger-2',
          type: 'trigger',
          name: 'Trigger com Tópico',
          config: {
            type: 'manual',
            data: {
              topic: 'Tendências de IA em 2025',
              targetAudience: 'Desenvolvedores e Tech Leaders',
              contentType: 'Educational',
            },
          },
          nextNodes: ['agent-4'],
        },
        {
          id: 'agent-4',
          type: 'agent',
          name: 'Pesquisa de Conteúdo (ResearchAgent)',
          config: {
            agentId: 'research-agent',
            prompt: `Faça uma pesquisa profunda sobre o tópico fornecido:
1. Busque as últimas tendências e estatísticas
2. Identifique autoridades no assunto
3. Colete dados relevantes
4. Organize informações em categorias
5. Crie um outline completo para o conteúdo`,
            inputFrom: 'trigger-2',
          },
          nextNodes: ['mcp-3'],
        },
        {
          id: 'mcp-3',
          type: 'mcp_tool',
          name: 'Buscar na Web',
          config: {
            mcpId: 'web-mcp',
            toolId: 'searchWeb',
            params: {
              query: '{{trigger-2.data.topic}} latest trends 2025',
              maxResults: 10,
            },
          },
          nextNodes: ['agent-5'],
        },
        {
          id: 'agent-5',
          type: 'agent',
          name: 'Redação de Artigo (ContentWriter)',
          config: {
            agentId: 'content-writer',
            prompt: `Com base na pesquisa, escreva um artigo completo e envolvente:
1. Introdução impactante (200 palavras)
2. Desenvolvimento com dados e exemplos (1500 palavras)
3. Casos de uso práticos
4. Conclusão com call-to-action
5. SEO otimizado
6. Tom profissional mas acessível`,
            inputFrom: 'agent-4',
          },
          nextNodes: ['file-2', 'agent-6'],
        },
        {
          id: 'file-2',
          type: 'file_operation',
          name: 'Salvar Artigo',
          config: {
            operation: 'write',
            filename: 'artigo.md',
            content: '{{agent-5.response}}',
          },
          nextNodes: [],
        },
        {
          id: 'agent-6',
          type: 'agent',
          name: 'Gerar Script de Vídeo (VideoScriptAgent)',
          config: {
            agentId: 'video-script-agent',
            prompt: `Transforme o artigo em um script de vídeo de 5 minutos:
1. Hook nos primeiros 5 segundos
2. Dividir em cenas (10-15 cenas)
3. Incluir direções visuais
4. Transições suaves
5. Conclusão memorável
6. Formato: [CENA] [NARRAÇÃO] [VISUAL]`,
            inputFrom: 'agent-5',
          },
          nextNodes: ['mcp-4'],
        },
        {
          id: 'mcp-4',
          type: 'mcp_tool',
          name: 'Gerar Imagens com IA',
          config: {
            mcpId: 'ai-image-mcp',
            toolId: 'generateImages',
            params: {
              prompts: '{{agent-6.response.visualCues}}',
              style: 'professional, modern, tech',
              count: 10,
            },
          },
          nextNodes: ['mcp-5'],
        },
        {
          id: 'mcp-5',
          type: 'mcp_tool',
          name: 'Texto para Áudio (TTS)',
          config: {
            mcpId: 'audio-mcp',
            toolId: 'textToSpeech',
            params: {
              text: '{{agent-6.response.narration}}',
              voice: 'pt-BR-neural-professional',
              speed: 1.0,
              output: 'narration.mp3',
            },
          },
          nextNodes: ['mcp-6'],
        },
        {
          id: 'mcp-6',
          type: 'mcp_tool',
          name: 'Gerar Legendas',
          config: {
            mcpId: 'subtitle-mcp',
            toolId: 'generateSubtitles',
            params: {
              audio: 'narration.mp3',
              language: 'pt-BR',
              output: 'legendas.srt',
            },
          },
          nextNodes: ['mcp-7'],
        },
        {
          id: 'mcp-7',
          type: 'mcp_tool',
          name: 'Montar Vídeo',
          config: {
            mcpId: 'video-mcp',
            toolId: 'createVideo',
            params: {
              images: '{{mcp-4.result.images}}',
              audio: 'narration.mp3',
              subtitles: 'legendas.srt',
              transitions: 'fade',
              output: 'video-final.mp4',
            },
          },
          nextNodes: ['agent-7'],
        },
        {
          id: 'agent-7',
          type: 'agent',
          name: 'Otimizar para Redes Sociais (SocialMediaAgent)',
          config: {
            agentId: 'social-media-agent',
            prompt: `Crie posts otimizados para diferentes plataformas:
1. LinkedIn (texto profissional + resumo)
2. Twitter/X (thread de 5 tweets)
3. Instagram (caption + hashtags)
4. YouTube (título + descrição + tags)
5. TikTok (caption curta + hashtags trending)`,
            inputFrom: 'agent-5',
          },
          nextNodes: ['loop-1'],
        },
        {
          id: 'loop-1',
          type: 'loop',
          name: 'Publicar em Plataformas',
          config: {
            items: ['linkedin', 'twitter', 'instagram', 'youtube', 'tiktok'],
            loopNodeId: 'mcp-8',
          },
          nextNodes: [],
        },
        {
          id: 'mcp-8',
          type: 'mcp_tool',
          name: 'Publicar Conteúdo',
          config: {
            mcpId: 'social-mcp',
            toolId: 'publishContent',
            params: {
              platform: '{{currentItem}}',
              content: '{{agent-7.response[currentItem]}}',
              media: 'video-final.mp4',
              schedule: 'immediate',
            },
          },
          nextNodes: [],
        },
      ],
    },
  ];
};
