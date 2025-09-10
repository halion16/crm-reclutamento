import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  QuestionAnswer as QuestionIcon,
  ExpandMore as ExpandMoreIcon,
  AutoFixHigh as MagicIcon
} from '@mui/icons-material';

const InterviewQuestionGenerator: React.FC = () => {
  const [selectedPosition, setSelectedPosition] = useState('');
  const [questions, setQuestions] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQuestions = async () => {
    if (!selectedPosition) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId: selectedPosition })
      });
      
      const result = await response.json();
      if (result.success) {
        setQuestions(result.data.questions);
      }
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box>
      <Card>
        <CardHeader
          title="❓ Generatore Domande Colloquio"
          subheader="Genera domande personalizzate per i colloqui"
        />
        <CardContent>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Seleziona Posizione</InputLabel>
              <Select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                label="Seleziona Posizione"
              >
                <MenuItem value="pos-1">Frontend Developer</MenuItem>
                <MenuItem value="pos-2">Backend Developer</MenuItem>
                <MenuItem value="pos-3">Full Stack Developer</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={generateQuestions}
              disabled={!selectedPosition || isGenerating}
              startIcon={isGenerating ? <CircularProgress size={16} /> : <MagicIcon />}
              fullWidth
            >
              {isGenerating ? 'Generando domande...' : 'Genera Domande AI'}
            </Button>

            {questions && (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Domande generate per: {questions.positionTitle}
                </Alert>
                
                {questions.questions.map((q: any, index: number) => (
                  <Accordion key={q.id || index}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">
                        {q.category.toUpperCase()} - {q.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Difficoltà: <Chip label={q.difficulty} size="small" />
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2">Criteri di valutazione:</Typography>
                          <List dense>
                            {q.evaluationCriteria.map((criterion: string, idx: number) => (
                              <ListItem key={idx}>
                                <ListItemText primary={criterion} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InterviewQuestionGenerator;