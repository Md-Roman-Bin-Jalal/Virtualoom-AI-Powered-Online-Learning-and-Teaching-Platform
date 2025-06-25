    // Handle generating AI writing assessment
    const handleGenerateWritingAssessment = async (e) => {
        e.preventDefault();
        setIsGenerating(true);
        setErrorMsg('');
        
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You must be logged in to create assessments');
                setIsGenerating(false);
                return;
            }
            
            if (!writingTopic || !writingType) {
                setErrorMsg('Topic and writing type are required');
                setIsGenerating(false);
                return;
            }
            
            // Call the new writing-ai endpoint
            const response = await fetch('http://localhost:5000/api/writing-ai/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: assessmentTitle || `${aiDifficulty} ${writingType} Assessment`,
                    timeLimit: aiTimeLimit,
                    email,
                    expiresIn,
                    expiryUnit,
                    difficulty: aiDifficulty,
                    writingType,
                    topic: writingTopic,
                    wordLimit: 500, // Default word limit
                    points: aiPointsPerQuestion || 10,
                    instructions: ''
                }),
            });
            const data = await response.json();
            
            if (data.success) {
                setSuccessMsg('Writing assessment created successfully!');
                setErrorMsg('');
                setQuizCreated(true);
                setQuizId(data.assessmentId); // Match the new API response
                setWritingAssessmentSubmitted(true);
                
                // Show success message
                setErrorMsg('Writing assessment created successfully!');
                showSuccessMessage();
                
                // Log the created assessment
                console.log("Created AI writing assessment:", data.assessment);
                
                // Switch to view mode after short delay
                setTimeout(() => {
                    setErrorMsg('');
                    setWritingGenerationMode('');
                    setWritingViewMode(true);
                    
                    // Fetch updated writing list
                    fetchCreatedWritingAssessments();
                    
                    // Set the newly created assessment as the one being viewed
                    const createdAssessment = {
                        _id: data.assessmentId,
                        title: data.title || `${aiDifficulty} ${writingType} Assessment`
                    };
                    setViewingAssessment(createdAssessment);
                    
                    // Reset form
                    setWritingTopic('');
                    setWritingType('essay');
                }, 1500);
            } else {
                setErrorMsg(data.message || 'Failed to create writing assessment');
            }
        } catch (error) {
            console.error('Error generating writing assessment:', error);
            setErrorMsg('Failed to generate writing assessment. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };
