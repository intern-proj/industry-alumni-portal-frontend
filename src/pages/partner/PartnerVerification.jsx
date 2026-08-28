import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { platformService } from '../../services/platformService';
import { useAuth } from '../../contexts/AuthContext';

export default function PartnerVerification() {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState('BUSINESS_REGISTRATION');

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const res = await platformService.getMyVerificationStatus();
        if (res.data) {
          setVerificationStatus(res.data);
          fetchDocuments(res.data.id);
        }
      } catch (error) {
        console.error("Failed to load verification status:", error);
      }
    };
    fetchVerification();
  }, []);

  const fetchDocuments = async (verificationId) => {
    try {
      const res = await platformService.listPartnerDocuments(verificationId);
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await platformService.deletePartnerDocument(verificationStatus.id, documentId);
      await fetchDocuments(verificationStatus.id);
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  const handleReapply = async () => {
    setUploading(true);
    try {
      await platformService.reapplyPartnerVerification();
      const verifRes = await platformService.getMyVerificationStatus();
      setVerificationStatus(verifRes.data);
    } catch (err) {
      console.error("Failed to reapply", err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!fileToUpload || !verificationStatus?.id) return;
    setUploading(true);
    try {
      // 1. Upload the file to the storage service
      const storageRes = await platformService.uploadFileToStorage(fileToUpload, user.id, 'OTHER');
      const storedFile = storageRes.data;

      // 2. Send the metadata to the platform management service
      const requestPayload = {
        documentType: selectedDocType,
        storageFileId: storedFile.fileId,
        originalFilename: storedFile.originalFilename,
        contentType: storedFile.contentType,
        sizeBytes: storedFile.fileSizeBytes
      };
      
      await platformService.uploadPartnerDocument(verificationStatus.id, requestPayload);
      setFileToUpload(null);
      await fetchDocuments(verificationStatus.id);
      
      // If status is PENDING_DOCUMENTS or MORE_INFO_REQUIRED, maybe auto submit?
      if (verificationStatus.status === 'PENDING_DOCUMENTS' || verificationStatus.status === 'MORE_INFO_REQUIRED') {
         await platformService.submitForReview(verificationStatus.id);
         const verifRes = await platformService.getMyVerificationStatus();
         setVerificationStatus(verifRes.data);
      }
    } catch (err) {
      console.error("Failed to upload document", err);
      if (err.response && err.response.data) {
        alert("Upload failed: " + (err.response.data.message || JSON.stringify(err.response.data)));
      } else {
        alert("Upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  if (!verificationStatus) return <div className="p-8">Loading verification data...</div>;

  const isVerified = verificationStatus.status === 'APPROVED';
  const isPendingDocs = verificationStatus.status === 'PENDING_DOCUMENTS';
  const isPendingReview = verificationStatus.status === 'PENDING_REVIEW';
  const isMoreInfo = verificationStatus.status === 'MORE_INFO_REQUIRED';
  const isRejected = verificationStatus.status === 'REJECTED';
  const canUpload = isPendingDocs || isMoreInfo;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Organization Verification</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Complete Stage 2 approval by uploading your official corporate documents.
        </p>
      </div>

      {(isMoreInfo || isRejected) && verificationStatus.rejectionReason && (
        <div className={`p-4 rounded-xl flex items-start justify-between gap-3 ${isRejected ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined shrink-0 mt-0.5">{isRejected ? 'cancel' : 'warning'}</span>
            <div>
              <h4 className="font-semibold">{isRejected ? 'Verification Declined' : 'Changes Requested'}</h4>
              <p className="text-sm mt-1 whitespace-pre-wrap">{verificationStatus.rejectionReason}</p>
            </div>
          </div>
          {isRejected && (
            <Button 
              variant="outline" 
              className="bg-white border-rose-200 text-rose-700 hover:bg-rose-100 shrink-0"
              onClick={handleReapply}
              loading={uploading}
            >
              Re-Apply
            </Button>
          )}
        </div>
      )}

      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center mx-auto overflow-hidden">
            <span className="material-symbols-outlined text-[48px] text-slate-400">verified_user</span>
          </div>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VERIFICATION STATUS</p>
              <p className={`text-sm font-semibold flex items-center justify-center gap-1.5 mt-1 ${isVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                <span className="material-symbols-outlined text-[18px]">
                  {isVerified ? 'verified' : 'pending_actions'}
                </span> 
                {isVerified ? 'Verified Industry Partner' : verificationStatus?.status?.replace('_', ' ') || 'Pending'}
              </p>
            </div>
            {isVerified && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MOU ACTIVE PERIOD</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Active (3 Years)</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!isVerified && (
      <Card className={canUpload ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10" : ""}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">assignment_add</span>
            Approval Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canUpload && (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Please upload a Verified Documentation of You Institute for Approval.
            </p>
          )}
          {isPendingReview && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Your documents are currently under review by the administrators.
            </p>
          )}
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="text-sm p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between group">
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">description</span>
                  <span className="truncate">{doc.originalFilename}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-semibold tracking-wider">
                    {doc.documentType}
                  </span>
                  {canUpload && (
                    <button onClick={() => handleDeleteDocument(doc.id)} className="text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(canUpload || isPendingReview) && (
             <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700 space-y-4">
                <Select 
                  label="Document Type"
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                >
                  <option value="BUSINESS_REGISTRATION">Business Registration</option>
                  <option value="TAX_CERTIFICATE">Tax Certificate</option>
                  <option value="AUTHORIZATION_LETTER">Authorization Letter</option>
                </Select>
                
                <input 
                   type="file" 
                   id="doc-upload" 
                   className="hidden" 
                   onChange={(e) => setFileToUpload(e.target.files[0])}
                />
                <div className="flex flex-col gap-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-center"
                    onClick={() => document.getElementById('doc-upload').click()}
                    type="button"
                    disabled={uploading}
                    >
                      {fileToUpload ? fileToUpload.name : 'Choose File to Upload'}
                    </Button>
                    {fileToUpload && (
                      <Button 
                        className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleFileUpload}
                        loading={uploading}
                        type="button"
                      >
                        Upload & Submit
                      </Button>
                    )}
                  </div>
               </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
