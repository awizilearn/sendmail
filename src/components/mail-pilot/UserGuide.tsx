"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookUser, Footprints, FileUp, CheckCircle2, PencilRuler, Send } from "lucide-react";

export default function UserGuide() {
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>
                    <div className="flex items-center gap-3">
                        <BookUser className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-semibold">Manuel d'utilisation</h2>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="prose prose-sm dark:prose-invert max-w-none pl-12">
                    <p>
                        Bienvenue sur Mail Pilot ! Cette application est conçue pour simplifier l'envoi d'e-mails personnalisés à partir d'une liste de destinataires fournie dans un fichier Excel.
                    </p>
                    <p>
                        <strong>Fonctionnalités clés :</strong>
                    </p>
                    <ul>
                        <li><strong>Importation de données :</strong> Importez facilement des fichiers .xlsx, .xls ou .csv contenant les informations de vos destinataires.</li>
                        <li><strong>Personnalisation d'e-mails :</strong> Utilisez des variables (par exemple, `{{Nom}}`) dans l'objet et le corps de votre e-mail pour insérer dynamiquement des données provenant de votre fichier.</li>
                        <li><strong>Prévisualisation en direct :</strong> Sélectionnez un destinataire pour voir instantanément à quoi ressemblera son e-mail personnalisé.</li>
                        <li><strong>Configuration SMTP :</strong> Configurez vos propres paramètres de serveur SMTP pour envoyer des e-mails directement depuis l'application.</li>
                        <li><strong>Prévention des doublons :</strong> Le système se souvient des e-mails déjà envoyés pour un rendez-vous donné, évitant ainsi les envois multiples.</li>
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
                            Cliquez sur la zone de téléchargement ou glissez-déposez votre fichier Excel. Assurez-vous que votre fichier contient une ligne d'en-tête et au moins une colonne nommée `adresse mail`. Pour la personnalisation `formateur/formatrice`, incluez une colonne `Civilité Formateur` avec les valeurs `M.` ou `Mme`.
                        </p>
                    </div>
                    <div>
                        <h4><CheckCircle2 className="inline-block w-5 h-5 mr-2"/>Étape 2 : Vérifier les Données</h4>
                        <p>
                            Une fois les données importées, elles apparaîtront dans un tableau. Cliquez sur une ligne pour sélectionner un destinataire. Cela mettra à jour l'aperçu de l'e-mail avec les informations de cette personne. Vous pouvez également exporter les données nettoyées si nécessaire.
                        </p>
                    </div>
                    <div>
                        <h4><PencilRuler className="inline-block w-5 h-5 mr-2"/>Étape 3 : Composer l'E-mail</h4>
                        <p>
                            Rédigez le sujet et le corps de votre e-mail. Utilisez le menu déroulant "Insérer une variable" pour ajouter des champs de votre fichier Excel dans votre modèle. Par exemple, si vous insérez `{{Bénéficiare}}`, il sera remplacé par le nom du destinataire. L'aperçu ci-dessous se met à jour en temps réel.
                        </p>
                    </div>
                    <div>
                        <h4><Send className="inline-block w-5 h-5 mr-2"/>Étape 4 : Configurer et Envoyer</h4>
                        <p>
                            Remplissez vos informations de serveur SMTP (hôte, port, nom d'utilisateur et mot de passe). Vous pouvez sauvegarder ces paramètres localement pour une utilisation future. Envoyez un e-mail de test pour vérifier votre configuration. Lorsque vous êtes prêt, cliquez sur "Envoyer" pour démarrer l'envoi à tous les destinataires de votre liste.
                        </p>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
