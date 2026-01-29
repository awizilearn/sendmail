
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookUser, Footprints, FileUp, PencilRuler, History } from "lucide-react";

export default function UserGuide() {
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>
                    <div className="flex items-center gap-3">
                        <BookUser className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-semibold">Manuel d'utilisation - envoi mail J-4</h2>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="prose prose-sm dark:prose-invert max-w-none pl-12">
                    <p>
                        Bienvenue sur envoi mail J-4 ! Cette application est conçue pour simplifier l'envoi d'e-mails personnalisés à partir d'une liste de destinataires fournie dans un fichier Excel.
                    </p>
                    <p>
                        <strong>Fonctionnalités clés :</strong>
                    </p>
                    <ul>
                        <li><strong>Importation de données :</strong> Importez facilement des fichiers .xlsx, .xls ou .csv contenant les informations de vos destinataires.</li>
                        <li><strong>Personnalisation d'e-mails :</strong> Utilisez des variables (par exemple, <code>{'{{Bénéficiare}}'}</code>) dans l'objet et le corps de votre e-mail pour insérer dynamiquement des données provenant de votre fichier.</li>
                        <li><strong>Génération de contenu par IA :</strong> Profitez de l'intelligence artificielle pour générer des paragraphes de message personnalisés en un seul clic.</li>
                        <li><strong>Prévisualisation en direct :</strong> Sélectionnez un destinataire pour voir instantanément à quoi ressemblera son e-mail personnalisé.</li>
                        <li><strong>Configuration SMTP sécurisée :</strong> Configurez vos propres paramètres de serveur SMTP. Le mot de passe peut être sauvegardé de manière sécurisée ou demandé à chaque envoi pour plus de flexibilité.</li>
                        <li><strong>Historique d'envoi :</strong> Accédez à un journal complet de tous les e-mails envoyés, avec leur statut (envoyé ou échoué), via l'onglet "Historique".</li>
                        <li><strong>Prévention des doublons et renvoi :</strong> Le système détecte les e-mails déjà envoyés pour un même rendez-vous. Avant l'envoi, un résumé vous est présenté avec une option pour confirmer et forcer le renvoi si nécessaire.</li>
                    </ul>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger>
                    <div className="flex items-center gap-3">
                        <Footprints className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-semibold">Guide Pas à Pas</h2>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="prose prose-sm dark:prose-invert max-w-none pl-12 space-y-4">
                    <div>
                        <h4><FileUp className="inline-block w-5 h-5 mr-2"/>Étape 1 : Importer les Données</h4>
                        <p>
                            Cliquez sur la zone de téléchargement ou glissez-déposez votre fichier Excel. L'application préserve l'ordre original de vos colonnes. Assurez-vous que votre fichier contient une ligne d'en-tête et au moins une colonne nommée `adresse mail`. Pour la personnalisation du genre (par ex. `formateur/formatrice`), incluez une colonne `Civilité Formateur`. Une fois l'import réussi, vous serez automatiquement dirigé vers l'étape suivante.
                        </p>
                    </div>
                    <div>
                        <h4><PencilRuler className="inline-block w-5 h-5 mr-2"/>Étape 2 : Composer et Envoyer</h4>
                        <p>
                           Sur cet écran, vous pouvez :
                        </p>
                        <ul>
                            <li><strong>Sélectionner des destinataires :</strong> Cochez les cases pour choisir qui recevra l'e-mail.</li>
                            <li><strong>Prévisualiser :</strong> Cliquez sur une ligne du tableau pour voir un aperçu de l'e-mail personnalisé pour ce destinataire.</li>
                            <li><strong>Composer l'e-mail :</strong> Rédigez le sujet et le corps de votre e-mail. Utilisez le menu déroulant "Insérer une variable" pour ajouter des champs de votre fichier Excel, ou cliquez sur "Générer avec l'IA" pour une suggestion de texte.</li>
                             <li><strong>Configurer & Envoyer :</strong> Assurez-vous que vos informations SMTP sont correctes dans l'onglet "Paramètres". Ensuite, cliquez sur "Envoyer". Une boîte de dialogue de confirmation apparaîtra, vous informant du nombre de nouveaux e-mails et de ceux déjà envoyés. Vous pourrez alors confirmer l'envoi et choisir de renvoyer les e-mails si nécessaire.</li>
                        </ul>
                    </div>
                     <div>
                        <h4><History className="inline-block w-5 h-5 mr-2"/>Étape 3 : Consulter l'Historique</h4>
                        <p>
                           Naviguez vers l'onglet "Historique d'envoi" dans le menu latéral pour voir la liste de tous les e-mails envoyés. Vous y trouverez le statut de livraison, les détails du destinataire et la date d'envoi pour chaque message.
                        </p>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
