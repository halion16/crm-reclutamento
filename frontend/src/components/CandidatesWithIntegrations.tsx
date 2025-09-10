import React, { useState } from 'react';
import CandidatesList from './CandidatesList';
import InterviewForm from './InterviewForm';
import BasicAdvancedPanel from './communication/BasicAdvancedPanel';
import CandidateInterviewsModal from './CandidateInterviewsModal';
import type { Candidate, Interview } from '../types';
import { interviewsAPI, handleApiError } from '../services/api';
import { toast } from 'react-hot-toast';

interface CandidatesWithIntegrationsProps {
  refreshTrigger: number;
}

const CandidatesWithIntegrations: React.FC<CandidatesWithIntegrationsProps> = ({ 
  refreshTrigger 
}) => {
  // Interview Form state
  const [interviewForm, setInterviewForm] = useState<{
    open: boolean;
    candidateId: number | null;
  }>({ open: false, candidateId: null });

  // Communication Panel state
  const [communicationPanel, setCommunicationPanel] = useState<{
    open: boolean;
    candidateId: number | null;
    candidateName: string;
  }>({ open: false, candidateId: null, candidateName: '' });

  // Candidate Interviews Modal state
  const [candidateInterviewsModal, setCandidateInterviewsModal] = useState<{
    open: boolean;
    candidate: Candidate | null;
    interviews: Interview[];
    loading: boolean;
  }>({ open: false, candidate: null, interviews: [], loading: false });

  // Template specifici per comunicazioni candidati
  const candidateTemplates = [
    {
      id: 1,
      name: 'Benvenuto - Nuovo Candidato',
      type: 'EMAIL' as const,
      subject: 'Benvenuto nel nostro processo di selezione',
      content: 'Gentile candidato, la ringraziamo per aver inviato la sua candidatura. Saremo lieti di valutarla.',
      category: 'Accoglienza'
    },
    {
      id: 2,
      name: 'Aggiornamento Status',
      type: 'EMAIL' as const,
      subject: 'Aggiornamento sulla sua candidatura',
      content: 'La informiamo che la sua candidatura è attualmente in fase di valutazione.',
      category: 'Aggiornamenti'
    },
    {
      id: 3,
      name: 'Richiesta Documenti',
      type: 'EMAIL' as const,
      subject: 'Richiesta documentazione aggiuntiva',
      content: 'Per procedere con la valutazione, avremmo bisogno di alcuni documenti aggiuntivi.',
      category: 'Documentazione'
    }
  ];

  const handleScheduleInterview = (candidateId: number) => {
    setInterviewForm({
      open: true,
      candidateId
    });
  };

  const handleSendCommunication = (candidateId: number, candidateName: string) => {
    setCommunicationPanel({
      open: true,
      candidateId,
      candidateName
    });
  };

  const handleViewInterviews = async (candidateId: number, candidate: Candidate) => {
    setCandidateInterviewsModal({
      open: true,
      candidate,
      interviews: [],
      loading: true
    });

    try {
      const response = await interviewsAPI.getByCandidate(candidateId);
      if (response.success) {
        setCandidateInterviewsModal(prev => ({
          ...prev,
          interviews: response.data || [],
          loading: false
        }));
      } else {
        toast.error('Errore nel caricamento dei colloqui');
        setCandidateInterviewsModal(prev => ({
          ...prev,
          loading: false
        }));
      }
    } catch (err) {
      toast.error(handleApiError(err));
      setCandidateInterviewsModal(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  return (
    <>
      <CandidatesList
        refreshTrigger={refreshTrigger}
        onScheduleInterview={handleScheduleInterview}
        onSendCommunication={handleSendCommunication}
        onViewInterviews={handleViewInterviews}
      />

      {/* Interview Form */}
      <InterviewForm
        open={interviewForm.open}
        onClose={() => setInterviewForm({ open: false, candidateId: null })}
        onSuccess={() => {
          // Refresh della lista candidati gestito dal parent
          setInterviewForm({ open: false, candidateId: null });
        }}
        interview={null}
        mode="create"
        onCommunicationRequest={(candidateId) => {
          // Chiude il form colloqui e apre comunicazioni
          setInterviewForm({ open: false, candidateId: null });
          const demoCandidates = [
            { id: 1, firstName: 'Marco', lastName: 'Rossi' },
            { id: 2, firstName: 'Laura', lastName: 'Bianchi' },
            { id: 3, firstName: 'Giuseppe', lastName: 'Verdi' },
            { id: 4, firstName: 'Anna', lastName: 'Neri' }
          ];
          const candidate = demoCandidates.find(c => c.id === candidateId);
          setCommunicationPanel({
            open: true,
            candidateId,
            candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidato'
          });
        }}
      />

      {/* Communication Panel */}
      {communicationPanel.candidateId && (
        <BasicAdvancedPanel
          open={communicationPanel.open}
          onClose={() => setCommunicationPanel({ open: false, candidateId: null, candidateName: '' })}
          onSuccess={() => {
            setCommunicationPanel({ open: false, candidateId: null, candidateName: '' });
          }}
          templates={candidateTemplates}
          preSelectedCandidates={[communicationPanel.candidateId]}
        />
      )}

      {/* Candidate Interviews Modal */}
      <CandidateInterviewsModal
        open={candidateInterviewsModal.open}
        onClose={() => setCandidateInterviewsModal({ open: false, candidate: null, interviews: [], loading: false })}
        candidate={candidateInterviewsModal.candidate}
        interviews={candidateInterviewsModal.interviews}
        loading={candidateInterviewsModal.loading}
      />
    </>
  );
};

export default CandidatesWithIntegrations;